<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
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
}
