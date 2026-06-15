<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AnnouncementController extends Controller
{
    public function index(): Response
    {
        $announcements = Announcement::with('author')
            ->recent()
            ->paginate(15);

        return Inertia::render('Announcements/Index', [
            'announcements' => $announcements,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Announcements/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Announcement::class);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:500'],
            'content' => ['required', 'string'],
            'priority' => ['nullable', 'string', 'in:low,medium,high,urgent'],
            'status' => ['nullable', 'string', 'in:draft,published'],
            'published_at' => ['nullable', 'date'],
        ]);

        $validated['author_id'] = auth()->id();

        Announcement::create($validated);

        return redirect()->route('announcements.index')
            ->with('success', 'Announcement created successfully.');
    }

    public function edit(Announcement $announcement): Response
    {
        $this->authorize('update', $announcement);

        return Inertia::render('Announcements/Edit', [
            'announcement' => $announcement,
        ]);
    }

    public function update(Request $request, Announcement $announcement): RedirectResponse
    {
        $this->authorize('update', $announcement);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:500'],
            'content' => ['required', 'string'],
            'priority' => ['nullable', 'string', 'in:low,medium,high,urgent'],
            'status' => ['nullable', 'string', 'in:draft,published'],
            'published_at' => ['nullable', 'date'],
        ]);

        $announcement->update($validated);

        return redirect()->route('announcements.index')
            ->with('success', 'Announcement updated successfully.');
    }

    public function destroy(Announcement $announcement): RedirectResponse
    {
        $this->authorize('delete', $announcement);

        $announcement->delete();

        return redirect()->route('announcements.index')
            ->with('success', 'Announcement deleted successfully.');
    }
}
