<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Symfony\Component\HttpFoundation\Response;

class CheckSessionTimeout
{
    private const LAST_ACTIVITY_KEY = 'last_activity_at';
    private const SESSION_TIMEOUT_MINUTES = 120;

    public function handle(Request $request, Closure $next, ?int $timeoutMinutes = null): Response
    {
        if (!auth()->check()) {
            return $next($request);
        }

        $timeout = $timeoutMinutes ?? self::SESSION_TIMEOUT_MINUTES;
        $lastActivity = $request->session()->get(self::LAST_ACTIVITY_KEY);

        if ($lastActivity) {
            $inactiveMinutes = Carbon::parse($lastActivity)->diffInMinutes(now());

            if ($inactiveMinutes >= $timeout) {
                activity()
                    ->causedBy(auth()->user())
                    ->withProperties(['reason' => 'session_timeout'])
                    ->log('session_expired');

                auth()->guard('web')->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                if ($request->expectsJson()) {
                    return response()->json([
                        'message' => __('auth.session_expired'),
                    ], 401);
                }

                return redirect()->route('login')
                    ->with('error', __('auth.session_expired'));
            }
        }

        $request->session()->put(self::LAST_ACTIVITY_KEY, now());

        return $next($request);
    }
}
