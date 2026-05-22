<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;

trait HasAuthor
{
    public static function bootHasAuthor(): void
    {
        static::creating(function ($model) {
            if (auth()->check() && !$model->author_id) {
                $model->author_id = auth()->id();
            }
        });
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id')->withTrashed();
    }
}
