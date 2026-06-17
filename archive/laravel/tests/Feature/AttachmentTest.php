<?php

namespace Tests\Feature;

use App\Models\Task;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AttachmentTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('attachments');
    }

    // ─── Valid Uploads ───

    public function test_can_upload_file_to_task(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
        ]);
        $file = UploadedFile::fake()->create('document.pdf', 100);

        $this->actingAsProjectManager();

        $response = $this->post(route('tasks.attachments.upload', $task, absolute: false), [
            'file' => $file,
        ]);

        $response->assertStatus(302);
        $this->assertCount(1, $task->fresh()->getMedia('attachments'));
    }

    public function test_can_upload_image_to_project(): void
    {
        $project = $this->createProjectWithMembers();
        $file = UploadedFile::fake()->image('screenshot.png', 200, 200);

        $this->actingAsProjectManager();

        $response = $this->post(route('projects.attachments.upload', $project, absolute: false), [
            'file' => $file,
        ]);

        $response->assertStatus(302);
        $this->assertCount(1, $project->fresh()->getMedia('attachments'));
    }

    public function test_employee_can_upload_file(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
            'assignee_id' => $this->employee->id,
        ]);
        $file = UploadedFile::fake()->create('notes.txt', 50);

        $this->actingAsEmployee();

        $response = $this->post(route('tasks.attachments.upload', $task, absolute: false), [
            'file' => $file,
        ]);

        $response->assertStatus(302);
        $this->assertCount(1, $task->fresh()->getMedia('attachments'));
    }

    // ─── Invalid MIME ───

    public function test_cannot_upload_invalid_mime_type(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
        ]);
        $file = UploadedFile::fake()->create('malware.exe', 100);

        $this->actingAsProjectManager();

        $response = $this->post(route('tasks.attachments.upload', $task, absolute: false), [
            'file' => $file,
        ]);

        $response->assertSessionHasErrors('file');
        $this->assertCount(0, $task->fresh()->getMedia('attachments'));
    }

    public function test_cannot_upload_php_file(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
        ]);
        $file = UploadedFile::fake()->create('shell.php', 100);

        $this->actingAsProjectManager();

        $response = $this->post(route('tasks.attachments.upload', $task, absolute: false), [
            'file' => $file,
        ]);

        $response->assertSessionHasErrors('file');
    }

    public function test_cannot_upload_html_file(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
        ]);
        $file = UploadedFile::fake()->create('page.html', 100);

        $this->actingAsProjectManager();

        $response = $this->post(route('tasks.attachments.upload', $task, absolute: false), [
            'file' => $file,
        ]);

        $response->assertSessionHasErrors('file');
    }

    // ─── Oversized File ───

    public function test_cannot_upload_oversized_file(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
        ]);
        $file = UploadedFile::fake()->create('large.pdf', 60000);

        $this->actingAsProjectManager();

        $response = $this->post(route('tasks.attachments.upload', $task, absolute: false), [
            'file' => $file,
        ]);

        $response->assertSessionHasErrors('file');
    }

    // ─── Unauthorized Access ───

    public function test_non_member_cannot_upload_file(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
        ]);
        $file = UploadedFile::fake()->create('secret.pdf', 100);
        $outsider = \App\Models\User::factory()->create();
        $outsider->assignRole(\App\Enums\UserRole::Employee->value);

        $this->actingAs($outsider);

        $response = $this->post(route('tasks.attachments.upload', $task, absolute: false), [
            'file' => $file,
        ]);

        $response->assertStatus(403);
    }

    public function test_employee_cannot_upload_to_task_not_assigned(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
            'assignee_id' => $this->teamLead->id,
        ]);
        $file = UploadedFile::fake()->create('doc.pdf', 100);

        $this->actingAsEmployee();

        $response = $this->post(route('tasks.attachments.upload', $task, absolute: false), [
            'file' => $file,
        ]);

        $response->assertStatus(403);
    }

    // ─── Delete ───

    public function test_can_delete_attachment(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
        ]);
        $media = $task->addMedia(UploadedFile::fake()->create('doc.pdf', 100))
            ->toMediaCollection('attachments');

        $this->actingAsProjectManager();

        $response = $this->delete(route('tasks.attachments.delete', [$task, $media], absolute: false));

        $response->assertStatus(302);
        $this->assertCount(0, $task->fresh()->getMedia('attachments'));
    }

    public function test_non_updater_cannot_delete_attachment(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
            'assignee_id' => $this->teamLead->id,
        ]);
        $media = $task->addMedia(UploadedFile::fake()->create('doc.pdf', 100))
            ->toMediaCollection('attachments');

        $this->actingAsEmployee();

        $response = $this->delete(route('tasks.attachments.delete', [$task, $media], absolute: false));

        $response->assertStatus(403);
    }
}
