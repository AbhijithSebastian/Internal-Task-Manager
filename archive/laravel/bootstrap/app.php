<?php

use App\Helpers\HttpStatus;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        channels: __DIR__ . '/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->api(append: [
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        ]);

        $middleware->alias([
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
            'session.timeout' => \App\Http\Middleware\CheckSessionTimeout::class,
        ]);

        $middleware->redirectGuestsTo(fn () => route('login'));
        $middleware->redirectUsersTo(fn () => route('dashboard'));
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->dontReport([
            \App\Exceptions\BusinessException::class,
            \Illuminate\Auth\AuthenticationException::class,
            ValidationException::class,
            ThrottleRequestsException::class,
        ]);

        $exceptions->reportable(function (Throwable $e) {
            if (app()->bound('sentry')) {
                $sentry = app('sentry');
                if ($sentry) {
                    $sentry->captureException($e);
                }
            }
        });

        // ─── Exception → Response Mappings ───

        $exceptions->render(function (ValidationException $e, Request $request) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => __('errors.validation_failed'),
                    'errors' => $e->errors(),
                ], HttpStatus::UNPROCESSABLE_ENTITY);
            }
            return back()->withErrors($e->errors())->withInput();
        });

        $exceptions->render(function (ModelNotFoundException $e, Request $request) {
            $message = __('errors.resource_not_found');
            if ($request->expectsJson()) {
                return response()->json(['message' => $message], HttpStatus::NOT_FOUND);
            }
            return redirect()->route('dashboard')->with('error', $message);
        });

        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if ($request->expectsJson()) {
                return response()->json(['message' => __('errors.route_not_found')], HttpStatus::NOT_FOUND);
            }
            return redirect()->route('dashboard');
        });

        $exceptions->render(function (AccessDeniedHttpException $e, Request $request) {
            if ($request->expectsJson() || app()->environment('testing')) {
                return response()->json(['message' => __('auth.forbidden')], HttpStatus::FORBIDDEN);
            }
            return back()->with('error', __('auth.forbidden'));
        });

        $exceptions->render(function (ThrottleRequestsException $e, Request $request) {
            $retryAfter = $e->getHeaders()['Retry-After'] ?? 60;
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => __('errors.too_many_requests'),
                    'retry_after' => $retryAfter,
                ], HttpStatus::TOO_MANY_REQUESTS);
            }
            return back()->with('error', __('errors.too_many_requests'));
        });

        $exceptions->render(function (\App\Exceptions\BusinessException $e, Request $request) {
            return $e->render();
        });

        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, Request $request) {
            if ($request->expectsJson()) {
                return response()->json(['message' => __('auth.unauthenticated')], HttpStatus::UNAUTHORIZED);
            }
            return redirect()->guest(route('login'));
        });
    })->create();
