<?php

namespace App\Http\Requests\User;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'job_title' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'role' => ['required', 'string', 'in:' . collect(UserRole::cases())->pluck('value')->implode(',')],
        ];
    }

    public function messages(): array
    {
        return [
            'password.confirmed' => 'The password confirmation does not match.',
            'role.in' => 'The selected role is invalid.',
        ];
    }
}
