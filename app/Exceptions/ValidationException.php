<?php

namespace App\Exceptions;

use App\Helpers\HttpStatus;

class ValidationException extends BusinessException
{
    public function __construct(
        string $message = 'Validation failed.',
        protected readonly array $errors = [],
        ?\Throwable $previous = null
    ) {
        parent::__construct(
            message: $message,
            publicMessage: $message,
            context: $errors,
            code: HttpStatus::UNPROCESSABLE_ENTITY,
            previous: $previous,
        );
    }

    public function getErrors(): array
    {
        return $this->errors;
    }

    public function render(): \Illuminate\Http\JsonResponse|\Illuminate\Http\RedirectResponse
    {
        if (request()->expectsJson()) {
            return response()->json([
                'message' => $this->getPublicMessage(),
                'errors' => $this->errors,
            ], $this->code);
        }

        return redirect()->back()
            ->withInput()
            ->withErrors($this->errors)
            ->with('error', $this->getPublicMessage());
    }
}
