<?php

namespace App\Http\Controllers;

use App\Models\MeetingLog;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class MeetingLogController extends Controller
{
    public function store(Request $request, Project $project)
    {
        Gate::authorize('update', $project);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'meeting_date' => ['required', 'date'],
            'attendees' => ['nullable', 'string', 'max:1000'],
            'summary' => ['required', 'string'],
            'decisions_taken' => ['nullable', 'string'],
            'blockers' => ['nullable', 'string'],
            'action_items' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        $project->meetingLogs()->create(array_merge($validated, [
            'author_id' => auth()->id(),
        ]));

        return back()->with('success', 'Meeting log created successfully.');
    }

    public function update(Request $request, MeetingLog $meetingLog)
    {
        Gate::authorize('update', $meetingLog->project);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'meeting_date' => ['required', 'date'],
            'attendees' => ['nullable', 'string', 'max:1000'],
            'summary' => ['required', 'string'],
            'decisions_taken' => ['nullable', 'string'],
            'blockers' => ['nullable', 'string'],
            'action_items' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        $meetingLog->update($validated);

        return back()->with('success', 'Meeting log updated successfully.');
    }

    public function destroy(MeetingLog $meetingLog)
    {
        Gate::authorize('update', $meetingLog->project);

        $meetingLog->delete();

        return back()->with('success', 'Meeting log deleted successfully.');
    }
}
