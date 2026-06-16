<?php

namespace App\Services\Auth;

use App\Enums\UserRole;
use App\Exceptions\AuthenticationException;
use App\Models\User;
use App\Services\Contracts\AuthServiceInterface;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class AuthService implements AuthServiceInterface
{
    private const MAX_ATTEMPTS = 5;
    private const LOCKOUT_MINUTES = 15;

    public function authenticate(array $credentials): User
    {
        $this->ensureNotRateLimited($credentials['email']);

        $user = User::where('email', $credentials['email'])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            RateLimiter::hit($this->throttleKey($credentials['email']), self::LOCKOUT_MINUTES * 60);
            throw new AuthenticationException(__('auth.failed'));
        }

        if (!$user->is_active) {
            throw new AuthenticationException(__('auth.inactive'));
        }

        RateLimiter::clear($this->throttleKey($credentials['email']));

        $user->update([
            'last_login_at' => now(),
            'last_login_ip' => request()->ip(),
        ]);

        activity()
            ->causedBy($user)
            ->withProperties(['ip' => request()->ip(), 'user_agent' => request()->userAgent()])
            ->log('authenticated');

        return $user;
    }

    public function register(array $data): User
    {
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'job_title' => $data['job_title'] ?? null,
        ]);

        $user->assignRole(UserRole::Employee->value);

        activity()
            ->causedBy($user)
            ->withProperties(['email' => $user->email])
            ->log('registered');

        return $user;
    }

    public function logout(): void
    {
        $user = auth()->user();

        if ($user) {
            activity()
                ->causedBy($user)
                ->withProperties(['ip' => request()->ip()])
                ->log('logged_out');
        }

        auth()->guard('web')->logout();
        session()->invalidate();
        session()->regenerateToken();
    }

    public function sendPasswordResetLink(string $email): string
    {
        $this->ensureNotRateLimited("reset:{$email}");

        $status = \Illuminate\Support\Facades\Password::sendResetLink(
            ['email' => $email]
        );

        if ($status === \Illuminate\Support\Facades\Password::RESET_LINK_SENT) {
            RateLimiter::clear($this->throttleKey("reset:{$email}"));
            return $status;
        }

        if ($status === \Illuminate\Support\Facades\Password::INVALID_USER) {
            return \Illuminate\Support\Facades\Password::RESET_LINK_SENT;
        }

        RateLimiter::hit($this->throttleKey("reset:{$email}"), self::LOCKOUT_MINUTES * 60);

        return $status;
    }

    public function resetPassword(array $data): string
    {
        $status = \Illuminate\Support\Facades\Password::reset(
            $data,
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                activity()
                    ->causedBy($user)
                    ->log('password_reset');
            }
        );

        return $status;
    }

    private function ensureNotRateLimited(string $key): void
    {
        $throttleKey = $this->throttleKey($key);

        if (RateLimiter::tooManyAttempts($throttleKey, self::MAX_ATTEMPTS)) {
            $seconds = RateLimiter::availableIn($throttleKey);

            throw new AuthenticationException(
                __('auth.throttle', ['seconds' => $seconds, 'minutes' => ceil($seconds / 60)])
            );
        }
    }

    private function throttleKey(string $identifier): string
    {
        return Str::lower($identifier) . '|' . request()->ip();
    }
}
