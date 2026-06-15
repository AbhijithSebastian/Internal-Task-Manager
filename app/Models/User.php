<?php

namespace App\Models;

use App\Enums\UserRole;
use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements HasMedia
{
    use HasApiTokens,
        HasFactory,
        HasRoles,
        Notifiable,
        SoftDeletes,
        LogsActivity,
        InteractsWithMedia;

    protected $fillable = [
        'name',
        'email',
        'password',
        'job_title',
        'phone',
        'avatar_url',
        'is_active',
        'email_verified_at',
        'last_login_at',
        'last_login_ip',
        'inherit_role_permissions',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'last_login_at' => 'datetime',
        'password' => 'hashed',
        'is_active' => 'boolean',
        'inherit_role_permissions' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected $appends = [
        'role',
        'is_super_admin',
        'avatar',
    ];

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('avatar')
            ->singleFile()
            ->registerMediaConversions(function (Media $media = null) {
                $this->addMediaConversion('thumb')
                    ->width(150)
                    ->height(150)
                    ->sharpen(10)
                    ->nonQueued();
                $this->addMediaConversion('small')
                    ->width(64)
                    ->height(64)
                    ->sharpen(10)
                    ->nonQueued();
            });

        $this->addMediaCollection('attachments');
    }

    public function getRoleAttribute(): ?UserRole
    {
        if (!$this->relationLoaded('roles')) {
            if (auth()->check() && auth()->id() === $this->id) {
                $this->load('roles');
            } elseif ($this->isSerializing()) {
                return null;
            } else {
                $this->load('roles');
            }
        }

        $roleName = $this->roles->first()?->name;

        return $roleName ? UserRole::tryFrom($roleName) : null;
    }

    public function getIsSuperAdminAttribute(): bool
    {
        if (!$this->relationLoaded('roles')) {
            if (auth()->check() && auth()->id() === $this->id) {
                $this->load('roles');
            } elseif ($this->isSerializing()) {
                return false;
            } else {
                $this->load('roles');
            }
        }

        return $this->hasRole(UserRole::SuperAdmin->value);
    }

    private function isSerializing(): bool
    {
        foreach (debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 15) as $step) {
            if (isset($step['function']) && in_array($step['function'], ['toArray', 'jsonSerialize', 'attributesToArray'], true)) {
                return true;
            }
        }
        return false;
    }

    public function getAvatarAttribute(): string
    {
        $media = $this->getFirstMedia('avatar');

        if ($media) {
            return $media->getFullUrl('thumb');
        }

        if ($this->avatar_url) {
            return $this->avatar_url;
        }

        try {
            return $this->gravatar_url;
        } catch (\Illuminate\Database\Eloquent\MissingAttributeException) {
            return '';
        }
    }

    public function getAvatarOriginalAttribute(): string
    {
        $media = $this->getFirstMedia('avatar');

        if ($media) {
            return $media->getFullUrl();
        }

        return $this->avatar;
    }

    public function getGravatarUrlAttribute(): string
    {
        $hash = md5(strtolower(trim($this->email ?? '')));

        return "https://www.gravatar.com/avatar/{$hash}?s=200&d=identicon";
    }

    public function getAvatarUrlAttribute(): string
    {
        return $this->avatar_url ?? $this->gravatar_url;
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeSearch($query, string $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->where('name', 'ilike', "%{$term}%")
              ->orWhere('email', 'ilike', "%{$term}%");
        });
    }

    public function projects(): BelongsToMany
    {
        return $this->belongsToMany(Project::class, 'project_members')
            ->select('projects.*')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function tasks(): BelongsToMany
    {
        return $this->belongsToMany(Task::class, 'task_user')->withTimestamps();
    }

    public function authoredTasks(): HasMany
    {
        return $this->hasMany(Task::class, 'author_id');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class, 'author_id');
    }
}
