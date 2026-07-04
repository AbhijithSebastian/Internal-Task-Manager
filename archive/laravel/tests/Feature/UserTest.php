<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class UserTest extends TestCase
{
    public function test_super_admin_can_update_user_details(): void
    {
        $this->actingAs($this->superAdmin);

        $response = $this->put(route('users.update', $this->employee), [
            'name' => 'Employee Updated',
            'email' => 'employee_updated@internaltool.com',
            'role' => UserRole::TeamLead->value,
            'job_title' => 'Lead Engineer',
            'phone' => '1234567890',
            'is_active' => true,
        ]);

        $response->assertRedirect(route('users.index'));
        $this->employee->refresh();

        $this->assertEquals('Employee Updated', $this->employee->name);
        $this->assertEquals('employee_updated@internaltool.com', $this->employee->email);
        $this->assertEquals('Lead Engineer', $this->employee->job_title);
        $this->assertEquals('1234567890', $this->employee->phone);
        $this->assertTrue($this->employee->hasRole(UserRole::TeamLead->value));
    }

    public function test_super_admin_can_upload_avatar(): void
    {
        $this->actingAsSuperAdmin();

        $file = UploadedFile::fake()->image('avatar.jpg', 200, 200);

        $response = $this->post(route('users.avatar.upload', $this->employee, absolute: false), [
            'avatar' => $file,
        ]);

        $response->assertSessionHas('success');
    }

    public function test_invalid_avatar_upload_fails(): void
    {
        $this->actingAsSuperAdmin();

        $file = UploadedFile::fake()->create('document.pdf', 100);

        $response = $this->post(route('users.avatar.upload', $this->employee, absolute: false), [
            'avatar' => $file,
        ]);

        $response->assertSessionHasErrors('avatar');
    }

    public function test_super_admin_can_delete_avatar(): void
    {
        $this->actingAsSuperAdmin();

        $file = UploadedFile::fake()->image('avatar.jpg', 200, 200);
        $this->post(route('users.avatar.upload', $this->employee, absolute: false), [
            'avatar' => $file,
        ]);

        $response = $this->delete(route('users.avatar.delete', $this->employee, absolute: false));

        $response->assertSessionHas('success');
    }

    public function test_employee_can_upload_own_avatar(): void
    {
        $this->actingAsEmployee();

        $file = UploadedFile::fake()->image('avatar.png', 200, 200);

        $response = $this->post(route('profile.avatar.upload', absolute: false), [
            'avatar' => $file,
        ]);

        $response->assertSessionHas('success');
    }

    public function test_employee_can_delete_own_avatar(): void
    {
        $this->actingAsEmployee();

        $file = UploadedFile::fake()->image('avatar.png', 200, 200);
        $this->post(route('profile.avatar.upload', absolute: false), ['avatar' => $file]);

        $response = $this->delete(route('profile.avatar.delete', absolute: false));

        $response->assertSessionHas('success');
    }

    public function test_super_admin_can_list_users(): void
    {
        $this->actingAsSuperAdmin();

        $response = $this->get(route('users.index', absolute: false));

        $response->assertStatus(200);
    }

    public function test_super_admin_can_create_user(): void
    {
        $this->actingAsSuperAdmin();

        $response = $this->post(route('users.store', absolute: false), [
            'name' => 'New User',
            'email' => 'newuser@test.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'role' => UserRole::Employee->value,
        ]);

        $response->assertRedirect(route('users.index'));
        $this->assertDatabaseHas('users', ['email' => 'newuser@test.com']);
    }

    public function test_super_admin_can_delete_user(): void
    {
        $this->actingAsSuperAdmin();

        $response = $this->delete(route('users.destroy', $this->employee, absolute: false));

        $response->assertSessionHas('success');
        $this->assertSoftDeleted($this->employee);
    }
}
