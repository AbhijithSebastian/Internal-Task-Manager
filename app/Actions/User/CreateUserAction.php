<?php

namespace App\Actions\User;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class CreateUserAction
{
    public function execute(array $data): User
    {
        $data['password'] = Hash::make($data['password']);

        return \Illuminate\Support\Facades\DB::transaction(function () use ($data) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
                'job_title' => $data['job_title'] ?? null,
                'phone' => $data['phone'] ?? null,
            ]);

            if (isset($data['role'])) {
                $roleName = $data['role'] instanceof \App\Enums\UserRole
                    ? $data['role']->value
                    : $data['role'];

                $user->assignRole($roleName);
            }

            activity()
                ->performedOn($user)
                ->causedBy(auth()->user())
                ->withProperties([
                    'email' => $user->email,
                    'role' => $data['role'] ?? 'employee',
                ])
                ->log("User {$user->name} was created.");

            return $user;
        });
    }
}
