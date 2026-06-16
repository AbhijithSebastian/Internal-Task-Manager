<?php

namespace Tests\Unit;

use App\Models\User;
use App\Services\User\UserService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserServiceTest extends TestCase
{
    use RefreshDatabase;

    private UserService $userService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->userService = app(UserService::class);
    }

    public function test_can_list_users(): void
    {
        User::factory(5)->create();

        $result = $this->userService->list();

        $this->assertCount(9, $result->items());
    }

    public function test_can_create_user(): void
    {
        $data = [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
            'job_title' => 'Developer',
        ];

        $user = $this->userService->create($data);

        $this->assertDatabaseHas('users', ['email' => 'john@example.com']);
    }

    public function test_can_soft_delete_user(): void
    {
        $user = User::factory()->create();

        $this->userService->delete($user);

        $this->assertSoftDeleted($user);
    }

    public function test_can_restore_user(): void
    {
        $user = User::factory()->create();
        $user->delete();

        $restored = $this->userService->restore($user->id);

        $this->assertFalse($restored->trashed());
    }
}
