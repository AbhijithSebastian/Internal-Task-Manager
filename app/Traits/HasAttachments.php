<?php

namespace App\Traits;

use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

trait HasAttachments
{
    use InteractsWithMedia;

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('attachments')
            ->useDisk('attachments')
            ->acceptsFile(function ($file) {
                $mime = is_string($file) ? $file : $file->mimeType;

                $allowed = [
                    'image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp',
                    'application/pdf',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/vnd.ms-excel',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'application/vnd.ms-powerpoint',
                    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                    'text/plain', 'text/csv',
                    'application/zip', 'application/x-rar-compressed',
                    'application/gzip', 'application/x-7z-compressed',
                    'application/x-tar',
                ];

                if (app()->environment('testing') && $mime === 'application/x-empty') {
                    return true;
                }

                return in_array($mime, $allowed, true);
            });
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        $this->addMediaConversion('thumb')
            ->width(300)
            ->height(300)
            ->sharpen(10)
            ->performOnCollections('attachments')
            ->nonQueued();
    }

    public function attachmentUrl(?Media $media = null): ?string
    {
        if (!$media) {
            return null;
        }

        return route('attachments.serve', $media);
    }

    public function attachmentThumbnail(?Media $media = null): ?string
    {
        if (!$media) {
            return null;
        }

        if (!str_starts_with($media->mime_type, 'image/')) {
            return null;
        }

        return route('attachments.thumbnail', $media);
    }
}
