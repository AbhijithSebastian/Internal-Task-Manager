<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Services\Contracts\AuthServiceInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Inertia\Inertia;
use Inertia\Response;

class NewPasswordController extends Controller
{
    public function __construct(
        private readonly AuthServiceInterface $authService
    ) {}

    public function create(Request $request): Response
    {
        return Inertia::render('Auth/ResetPassword', [
            'email' => $request->email,
            'token' => $request->route('token'),
        ]);
    }

    public function store(ResetPasswordRequest $request): RedirectResponse
    {
        $status = $this->authService->resetPassword($request->validated());

        if ($status === Password::PASSWORD_RESET) {
            return redirect()->route('login')->with('success', __($status));
        }

        return back()->withErrors([
            'email' => [__($status)],
        ]);
    }
}
