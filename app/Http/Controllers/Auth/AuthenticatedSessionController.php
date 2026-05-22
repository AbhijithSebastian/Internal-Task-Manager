<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Services\Contracts\AuthServiceInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    public function __construct(
        private readonly AuthServiceInterface $authService
    ) {}

    public function create(): Response
    {
        if (auth()->check()) {
            return redirect()->intended(route('dashboard'));
        }

        return Inertia::render('Auth/Login');
    }

    public function store(LoginRequest $request): RedirectResponse
    {
        $credentials = $request->only('email', 'password');
        $remember = $request->boolean('remember');

        $user = $this->authService->authenticate($credentials);

        auth()->login($user, $remember);

        $request->session()->regenerate();

        return redirect()->intended(route('dashboard'))
            ->with('success', __('auth.welcome_back', ['name' => $user->name]));
    }

    public function destroy(Request $request): RedirectResponse
    {
        $this->authService->logout();

        return redirect()->route('login')
            ->with('success', __('auth.logged_out'));
    }
}
