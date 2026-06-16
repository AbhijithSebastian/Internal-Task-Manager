<?php

namespace App\Http\Controllers;

use App\Models\Milestone;
use App\Models\Project;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class MilestoneController extends Controller
{
    public function store(Request $request, Project $project): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:500'],
            'description' => ['nullable', 'string'],
            'due_date' => ['nullable', 'date'],
            'status' => ['nullable', 'string', 'in:pending,in_progress,at_risk,completed,cancelled'],
        ]);

        $validated['project_id'] = $project->id;
        $validated['author_id'] = auth()->id();
        $validated['completed_at'] = ($validated['status'] ?? '') === 'completed' ? now() : null;

        Milestone::create($validated);

        return redirect()->back()->with('success', 'Milestone created.');
    }

    public function update(Request $request, Milestone $milestone): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:500'],
            'description' => ['nullable', 'string'],
            'due_date' => ['nullable', 'date'],
            'status' => ['nullable', 'string', 'in:pending,in_progress,at_risk,completed,cancelled'],
        ]);

        if (($validated['status'] ?? '') === 'completed' && !$milestone->completed_at) {
            $validated['completed_at'] = now();
        } elseif (($validated['status'] ?? '') !== 'completed') {
            $validated['completed_at'] = null;
        }

        $milestone->update($validated);

        return redirect()->back()->with('success', 'Milestone updated.');
    }

    public function destroy(Milestone $milestone): RedirectResponse
    {
        $milestone->delete();

        return redirect()->back()->with('success', 'Milestone deleted.');
    }
}
