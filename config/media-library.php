<?php

return [
    'disk_name' => env('MEDIA_DISK', 'public'),
    'max_file_size' => 1024 * 1024 * 50,
    'queue_conversions_by_default' => true,
    'queued_conversions_queue_name' => 'media',
    'responsive_images' => [
        'width_calculator' => Spatie\MediaLibrary\ResponsiveImages\WidthCalculator\FileSizeOptimizedWidthCalculator::class,
        'use_tiny_placeholders' => true,
        'tiny_placeholder_generator' => Spatie\MediaLibrary\ResponsiveImages\TinyPlaceholderGenerator\Blurred::class,
    ],
    'responsive_images_with_placeholder' => false,
    'enable_various_versions' => false,
    'conversion_queue_name' => 'media',
    'media_model' => Spatie\MediaLibrary\MediaCollections\Models\Media::class,
    'remote' => [
        'extra_headers' => [
            'CacheControl' => 'max-age=604800',
        ],
    ],
    'image_optimizers' => [
        Spatie\ImageOptimizer\Optimizers\Jpegoptim::class => [
            '-m85',
            '--force',
            '--strip-all',
            '--all-progressive',
        ],
        Spatie\ImageOptimizer\Optimizers\Pngquant::class => [
            '--force',
        ],
        Spatie\ImageOptimizer\Optimizers\Optipng::class => [
            '-i0',
            '-o2',
            '-q',
        ],
        Spatie\ImageOptimizer\Optimizers\Svgo::class => [
            '--disable=cleanupNumericValues',
        ],
        Spatie\ImageOptimizer\Optimizers\Gifsicle::class => [
            '-b',
            '-O3',
        ],
        Spatie\ImageOptimizer\Optimizers\Cwebp::class => [
            '-m 6',
            '-pass 10',
            '-mt',
            '-q 80',
        ],
    ],
    'image_generators' => [
        Spatie\MediaLibrary\Conversions\ImageGenerators\Image::class,
        Spatie\MediaLibrary\Conversions\ImageGenerators\Webp::class,
        Spatie\MediaLibrary\Conversions\ImageGenerators\Pdf::class,
        Spatie\MediaLibrary\Conversions\ImageGenerators\Svg::class,
        Spatie\MediaLibrary\Conversions\ImageGenerators\Video::class,
    ],
    'temporary_upload_model' => Spatie\MediaLibraryPro\Models\TemporaryUpload::class,
    'database_connection' => env('DB_CONNECTION', 'pgsql'),
];
