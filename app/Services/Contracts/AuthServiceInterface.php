<?php

namespace App\Services\Contracts;

use App\Models\User;

interface AuthServiceInterface
{
    public function authenticate(array $credentials): User;
    public function register(array $data): User;
    public function logout(): void;
}
