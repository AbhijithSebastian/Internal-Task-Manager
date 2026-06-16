<?php

namespace App\Http\Requests\Project;

use App\Enums\ProjectPriority;
use App\Enums\ProjectStatus;
use Illuminate\Foundation\Http\FormRequest;

class UpdateProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:10000'],
            'status' => ['sometimes', 'required', 'string', 'in:' . collect(ProjectStatus::cases())->pluck('value')->implode(',')],
            'priority' => ['sometimes', 'required', 'string', 'in:' . collect(ProjectPriority::cases())->pluck('value')->implode(',')],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'pm_id' => ['nullable', 'exists:users,id'],
            'lead_id' => ['nullable', 'exists:users,id'],
            'figma_url' => ['nullable', 'url', 'max:2048'],
            'github_url' => ['nullable', 'url', 'max:2048'],
            'docs_url' => ['nullable', 'url', 'max:2048'],
            'meeting_url' => ['nullable', 'url', 'max:2048'],
        ];
    }

    public function messages(): array
    {
        return [
            'figma_url.url' => 'The Figma URL must be a valid URL.',
            'github_url.url' => 'The GitHub URL must be a valid URL.',
            'docs_url.url' => 'The documentation URL must be a valid URL.',
            'meeting_url.url' => 'The meeting URL must be a valid URL.',
        ];
    }
}
