<?php

namespace App\Services\Attachment;

use App\Models\Project;
use App\Models\Task;
use App\Services\Core\BaseService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AttachmentService extends BaseService
{
    protected function model(): string
    {
        return Media::class;
    }

    public function upload(HasMedia $model, UploadedFile $file, ?string $collection = 'attachments'): Media
    {
        $media = $model->addMedia($file)
            ->withCustomProperties([
                'uploaded_by' => auth()->id(),
                'uploaded_by_name' => auth()->user()?->name,
                'uploaded_at' => now()->toISOString(),
            ])
            ->toMediaCollection($collection);

        log_activity($model, 'Attachment uploaded', [
            'file_name' => $media->file_name,
            'file_size' => $media->size,
            'mime_type' => $media->mime_type,
            'collection' => $collection,
            'uploaded_by' => auth()->user()?->name,
        ]);

        return $media;
    }

    public function delete(Model|int|string $idOrModel): void
    {
        $media = $idOrModel instanceof Media ? $idOrModel : $this->find($idOrModel);
        $model = $media->model;

        log_activity($model, 'Attachment deleted', [
            'file_name' => $media->file_name,
            'file_size' => $media->size,
            'deleted_by' => auth()->user()?->name,
        ]);

        $media->delete();
    }

    public function serve(Media $media): StreamedResponse|\Illuminate\Http\RedirectResponse
    {
        if ($media->disk === 's3') {
            return redirect()->away($media->getTemporaryUrl(now()->addMinutes(60)));
        }

        return response()->streamDownload(function () use ($media) {
            echo stream_get_contents($media->getStream());
        }, $media->file_name, [
            'Content-Type' => $media->mime_type,
            'Content-Length' => $media->size,
        ]);
    }

    public function thumbnail(Media $media): StreamedResponse|\Illuminate\Http\RedirectResponse|\Illuminate\Http\Response
    {
        if (!str_starts_with($media->mime_type, 'image/')) {
            abort(404);
        }

        if ($media->disk === 's3') {
            return redirect()->away($media->getTemporaryUrl(now()->addMinutes(60), 'thumb'));
        }

        $thumbPath = $media->getPath('thumb');

        if (!file_exists($thumbPath)) {
            $conversion = $media->mediaConversion('thumb');
            if ($conversion && class_exists('Spatie\MediaLibrary\Conversions\Conversion')) {
                $conversion->performOnCollections('attachments');
            }
            $media->generateConversion('thumb');
        }

        return response()->streamDownload(function () use ($media, $thumbPath) {
            if (file_exists($thumbPath)) {
                echo file_get_contents($thumbPath);
            } else {
                echo stream_get_contents($media->getStream());
            }
        }, $media->file_name, [
            'Content-Type' => $media->mime_type,
        ]);
    }

    public function getAttachments(HasMedia $model, string $collection = 'attachments'): iterable
    {
        return $model->getMedia($collection)->map(function (Media $media) {
            $media->url = $media->model->attachmentUrl($media);
            $media->thumbnail_url = $media->model->attachmentThumbnail($media);

            return $media;
        });
    }
}
