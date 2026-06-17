<?php

namespace Tests\Feature;

use App\Models\Announcement;
use App\Models\User;
use Tests\TestCase;

class AnnouncementTest extends TestCase
{
    private function createAnnouncement(): Announcement
    {
        return Announcement::factory()->create(['author_id' => $this->superAdmin->id]);
    }

    public function test_super_admin_can_view_announcements(): void
    {
        $this->actingAsSuperAdmin();

        $response = $this->get(route('announcements.index', absolute: false));

        $response->assertStatus(200);
    }

    public function test_super_admin_can_create_announcement(): void
    {
        $this->actingAsSuperAdmin();

        $response = $this->post(route('announcements.store', absolute: false), [
            'title' => 'Test Announcement',
            'content' => 'This is a test announcement content.',
            'priority' => 'medium',
        ]);

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('announcements', ['title' => 'Test Announcement']);
    }

    public function test_super_admin_can_update_announcement(): void
    {
        $this->actingAsSuperAdmin();

        $announcement = $this->createAnnouncement();

        $response = $this->put(route('announcements.update', $announcement, absolute: false), [
            'title' => 'Updated Title',
            'content' => 'Updated content.',
        ]);

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('announcements', ['title' => 'Updated Title']);
    }

    public function test_super_admin_can_delete_announcement(): void
    {
        $this->actingAsSuperAdmin();

        $announcement = $this->createAnnouncement();

        $response = $this->delete(route('announcements.destroy', $announcement, absolute: false));

        $this->assertSoftDeleted($announcement);
    }

    public function test_employee_cannot_create_announcement(): void
    {
        $this->actingAsEmployee();

        $response = $this->post(route('announcements.store', absolute: false), [
            'title' => 'Test Announcement',
            'content' => 'Content',
        ]);

        $response->assertStatus(403);
    }
}
