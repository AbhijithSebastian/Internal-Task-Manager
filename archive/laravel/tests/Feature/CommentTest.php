<?php

namespace Tests\Feature;

use App\Models\Comment;
use App\Models\Task;
use Tests\TestCase;

class CommentTest extends TestCase
{
    // ─── Create ───

    public function test_can_create_comment(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
        ]);

        $this->actingAsEmployee();

        $response = $this->post(route('comments.store', $task, absolute: false), [
            'body' => 'This is a test comment',
        ]);

        $response->assertStatus(302);
        $this->assertDatabaseHas('comments', [
            'body' => 'This is a test comment',
            'task_id' => $task->id,
        ]);
    }

    public function test_create_comment_requires_body(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
        ]);

        $this->actingAsEmployee();

        $response = $this->post(route('comments.store', $task, absolute: false), []);

        $response->assertSessionHasErrors('body');
    }

    public function test_non_member_cannot_create_comment(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
        ]);
        $outsider = \App\Models\User::factory()->create();
        $outsider->assignRole(\App\Enums\UserRole::Employee->value);

        $this->actingAs($outsider);

        $response = $this->post(route('comments.store', $task, absolute: false), [
            'body' => 'Outsider comment',
        ]);

        $response->assertStatus(403);
    }

    public function test_can_create_reply_to_comment(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
        ]);
        $parent = $task->comments()->create([
            'body' => 'Parent comment',
            'author_id' => $this->projectManager->id,
            'project_id' => $project->id,
        ]);

        $this->actingAsEmployee();

        $response = $this->post(route('comments.store', $task, absolute: false), [
            'body' => 'Reply to comment',
            'parent_id' => $parent->id,
        ]);

        $response->assertStatus(302);
        $this->assertDatabaseHas('comments', [
            'body' => 'Reply to comment',
            'parent_id' => $parent->id,
        ]);
    }

    // ─── Edit ───

    public function test_author_can_update_own_comment(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
        ]);
        $comment = $task->comments()->create([
            'body' => 'Original comment',
            'author_id' => $this->teamLead->id,
            'project_id' => $project->id,
        ]);

        $this->actingAsTeamLead();

        $response = $this->put(route('comments.update', $comment, absolute: false), [
            'body' => 'Updated comment',
        ]);

        $response->assertStatus(302);
        $this->assertEquals('Updated comment', $comment->fresh()->body);
    }

    public function test_non_author_cannot_update_comment(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
        ]);
        $comment = $task->comments()->create([
            'body' => 'PM comment',
            'author_id' => $this->projectManager->id,
            'project_id' => $project->id,
        ]);

        $this->actingAsEmployee();

        $response = $this->put(route('comments.update', $comment, absolute: false), [
            'body' => 'Hacked!',
        ]);

        $response->assertStatus(403);
    }

    // ─── Delete ───

    public function test_author_can_delete_own_comment(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
        ]);
        $comment = $task->comments()->create([
            'body' => 'Deletable comment',
            'author_id' => $this->teamLead->id,
            'project_id' => $project->id,
        ]);

        $this->actingAsTeamLead();

        $response = $this->delete(route('comments.destroy', $comment, absolute: false));

        $response->assertStatus(302);
        $this->assertSoftDeleted($comment);
    }

    public function test_non_author_cannot_delete_comment(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
        ]);
        $comment = $task->comments()->create([
            'body' => 'PM comment',
            'author_id' => $this->projectManager->id,
            'project_id' => $project->id,
        ]);

        $this->actingAsEmployee();

        $response = $this->delete(route('comments.destroy', $comment, absolute: false));

        $response->assertStatus(403);
    }

    // ─── Mention Parsing ───

    public function test_comment_with_mention_stores_mention(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
        ]);

        $this->actingAsEmployee();

        $this->post(route('comments.store', $task, absolute: false), [
            'body' => "Hey @{$this->projectManager->name} please review this",
        ]);

        $comment = Comment::where('body', "Hey @{$this->projectManager->name} please review this")->first();
        $this->assertNotNull($comment);
    }

    public function test_mention_in_comment_creates_mention_record(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
        ]);

        $this->actingAsEmployee();

        $this->post(route('comments.store', $task, absolute: false), [
            'body' => "Hey @{$this->projectManager->name} check this",
        ]);

        $comment = Comment::where('body', "Hey @{$this->projectManager->name} check this")->first();
        $this->assertNotNull($comment);
    }

    // ─── XSS Protection Verification ───

    public function test_comment_stores_html_as_escaped_text(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
        ]);

        $this->actingAsEmployee();

        $maliciousBody = '<script>alert("xss")</script>';
        $response = $this->post(route('comments.store', $task, absolute: false), [
            'body' => $maliciousBody,
        ]);

        $response->assertStatus(302);

        $comment = Comment::where('body', $maliciousBody)->first();
        $this->assertNotNull($comment);
        $this->assertEquals($maliciousBody, $comment->body);
    }

    public function test_comment_with_img_tag_xss_is_stored_safely(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
        ]);

        $this->actingAsEmployee();

        $maliciousBody = '<img src=x onerror=alert(1)>';
        $response = $this->post(route('comments.store', $task, absolute: false), [
            'body' => $maliciousBody,
        ]);

        $response->assertStatus(302);

        $comment = Comment::where('body', $maliciousBody)->first();
        $this->assertNotNull($comment);
        $this->assertEquals($maliciousBody, $comment->body);
    }

    public function test_comment_with_html_is_rendered_as_escaped_text(): void
    {
        $project = $this->createProjectWithMembers();
        $task = Task::factory()->create([
            'project_id' => $project->id,
            'author_id' => $this->projectManager->id,
        ]);

        $this->actingAsEmployee();

        $response = $this->post(route('comments.store', $task, absolute: false), [
            'body' => '<b>bold text</b>',
        ]);

        $response->assertStatus(302);

        $this->assertDatabaseHas('comments', [
            'body' => '<b>bold text</b>',
        ]);
    }
}
