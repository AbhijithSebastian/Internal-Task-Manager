<?php

namespace App\Http\Requests\Attachment;

use Illuminate\Foundation\Http\FormRequest;

class StoreAttachmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => [
                'required',
                'file',
                'max:51200',
                'mimes:jpeg,jpg,png,gif,svg,webp,pdf,doc,docx,xls,xlsx,ppt,pptx,txt,csv,zip,rar,tar,gz,7z',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'file.required' => 'Please select a file to upload.',
            'file.file' => 'The uploaded file is invalid.',
            'file.max' => 'File size must not exceed 50MB.',
            'file.mimes' => 'Allowed file types: images, PDF, documents, spreadsheets, presentations, text files, and archives.',
        ];
    }
}
