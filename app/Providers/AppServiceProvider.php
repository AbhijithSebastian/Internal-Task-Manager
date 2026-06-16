<?php

namespace App\Providers;

use App\Services\Auth\AuthService;
use App\Services\Comment\CommentService;
use App\Services\Dashboard\DashboardService;
use App\Services\Notification\NotificationService;
use App\Services\Project\ProjectService;
use App\Services\Task\TaskService;
use App\Services\User\UserService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    private const SERVICE_BINDINGS = [
        \App\Services\Contracts\AuthServiceInterface::class => AuthService::class,
        \App\Services\Contracts\DashboardServiceInterface::class => DashboardService::class,
        \App\Services\Contracts\ReportServiceInterface::class => \App\Services\Report\ReportService::class,
        \App\Services\Search\SearchServiceInterface::class => \App\Services\Search\DatabaseSearchService::class,
    ];

    private const TYPE_SERVICE_BINDINGS = [
        \App\Services\Integration\Contracts\IntegrationInterface::class . ':github' => \App\Services\Integration\Types\GitHubIntegration::class,
        \App\Services\Integration\Contracts\IntegrationInterface::class . ':figma' => \App\Services\Integration\Types\FigmaIntegration::class,
        \App\Services\Integration\Contracts\IntegrationInterface::class . ':email_hook' => \App\Services\Integration\Types\EmailHookIntegration::class,
    ];

    private const ALIASES = [
        'user_service' => UserService::class,
        'project_service' => ProjectService::class,
        'task_service' => TaskService::class,
        'comment_service' => CommentService::class,
        'notification_service' => NotificationService::class,
    ];

    public function register(): void
    {
        $this->registerServiceBindings();
        $this->registerFacades();
    }

    public function boot(): void
    {
        $this->configureModelStrictness();
        $this->configureVite();
        $this->registerMacros();
        $this->suppressPhp85Deprecations();

        \Illuminate\Support\Facades\Route::bind('role', function (string $value) {
            if (is_numeric($value)) {
                return \Spatie\Permission\Models\Role::findOrFail((int) $value);
            }
            return \Spatie\Permission\Models\Role::findByName($value);
        });
    }

    private function registerServiceBindings(): void
    {
        foreach (self::SERVICE_BINDINGS as $interface => $implementation) {
            $this->app->singleton($interface, $implementation);
        }

        foreach (self::TYPE_SERVICE_BINDINGS as $interface => $implementation) {
            $this->app->singleton($interface, $implementation);
        }

        $this->app->singleton(\App\Services\Integration\IntegrationService::class);

        $this->app->singleton(\App\Actions\Task\UpdateTaskStatusAction::class);
        $this->app->singleton(\App\Actions\Comment\ProcessMentionsAction::class);
        $this->app->singleton(\App\Actions\Project\AddMemberAction::class);
        $this->app->singleton(\App\Actions\User\CreateUserAction::class);
    }

    private function registerFacades(): void
    {
        foreach (self::ALIASES as $alias => $class) {
            $this->app->alias($class, $alias);
        }
    }

    private function configureModelStrictness(): void
    {
        Model::preventLazyLoading(!$this->app->isProduction());
        Model::shouldBeStrict($this->app->isLocal());

        if ($this->app->environment('local')) {
            DB::listen(function ($query) {
                if ($query->time > 100) {
                    logger()->warning('Slow query detected', [
                        'sql' => $query->sql,
                        'bindings' => $query->bindings,
                        'time' => $query->time,
                    ]);
                }
            });
        }
    }

    private function configureVite(): void
    {
        Vite::prefetch(concurrency: 3);
    }

    private function registerMacros(): void
    {
        \Illuminate\Database\Query\Builder::macro('search', function (array $columns, string $term) {
            if (empty($term)) {
                return $this;
            }

            return $this->where(function ($query) use ($columns, $term) {
                foreach ($columns as $column) {
                    $query->orWhere($column, 'ilike', "%{$term}%");
                }
            });
        });
    }

    private function suppressPhp85Deprecations(): void
    {
        if ($this->app->environment('local', 'testing')) {
            error_reporting(E_ALL & ~E_DEPRECATED & ~E_USER_DEPRECATED);
        }
    }
}
