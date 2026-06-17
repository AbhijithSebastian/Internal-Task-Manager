<?php

namespace App\Http\Controllers;

use App\Http\Requests\Attachment\StoreAttachmentRequest;
use App\Models\Project;
use App\Models\Task;
use App\Services\Attachment\AttachmentService;
use Illuminate\Http\RedirectResponse;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class AttachmentController extends Controller
{
    public function __construct(
        private readonly AttachmentService $attachmentService
    ) {}

    public function storeTask(Task $task, StoreAttachmentRequest $request): RedirectResponse
    {
        $this->authorize('update', $task);

        $this->attachmentService->upload($task, $request->file('file'));

        return redirect()->back()->with('success', 'File uploaded.');
    }

    public function storeProject(Project $project, StoreAttachmentRequest $request): RedirectResponse
    {
        $this->authorize('update', $project);

        $this->attachmentService->upload($project, $request->file('file'));

        return redirect()->back()->with('success', 'File uploaded.');
    }

    public function destroyTask(Task $task, Media $media): RedirectResponse
    {
        $this->authorize('update', $task);

        $this->attachmentService->delete($media);

        return redirect()->back()->with('success', 'File deleted.');
    }

    public function destroyProject(Project $project, Media $media): RedirectResponse
    {
        $this->authorize('update', $project);

        $this->attachmentService->delete($media);

        return redirect()->back()->with('success', 'File deleted.');
    }

    public function serve(Media $media): mixed
    {
        $model = $media->model;

        $policy = $model instanceof Task ? 'view' : 'view';
        $this->authorize($policy, $model);

        return $this->attachmentService->serve($media);
    }

    public function thumbnail(Media $media): mixed
    {
        $model = $media->model;

        $this->authorize('view', $model);

        return $this->attachmentService->thumbnail($media);
    }
}
