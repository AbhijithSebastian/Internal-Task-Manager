<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function edit(): Response
    {
        $user = auth()->user()->load('roles')->append(['avatar']);

        return Inertia::render('Profile/Edit', [
            'user' => $user,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $user = auth()->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'job_title' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
        ]);

        $changes = [];
        foreach ($validated as $field => $value) {
            if ($user->{$field} !== $value) {
                $changes[$field] = ['old' => $user->{$field}, 'new' => $value];
            }
        }

        $user->update($validated);

        if (!empty($changes)) {
            log_activity($user, 'Profile updated', ['changes' => $changes]);
        }

        return redirect()->back()->with('success', 'Profile updated successfully.');
    }

    public function updatePassword(Request $request): RedirectResponse
    {
        $user = auth()->user();

        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $user->update(['password' => Hash::make($validated['password'])]);

        log_activity($user, 'Password changed');

        return redirect()->back()->with('success', 'Password updated successfully.');
    }

    public function uploadAvatar(Request $request): RedirectResponse
    {
        $user = auth()->user();

        $validated = $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:2048'],
        ]);

        $file = $request->file('avatar');

        abort_unless($file->isValid(), 422, 'Invalid file upload.');

        $fileName = $file->getClientOriginalName();

        $user->addMedia($file)
            ->toMediaCollection('avatar');

        log_activity($user, 'Avatar updated', [
            'file_name' => $fileName,
        ]);

        return redirect()->back()->with('success', 'Avatar updated successfully.');
    }

    public function deleteAvatar(): RedirectResponse
    {
        $user = auth()->user();

        $user->clearMediaCollection('avatar');

        log_activity($user, 'Avatar removed');

        return redirect()->back()->with('success', 'Avatar removed successfully.');
    }
}
