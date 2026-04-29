<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SendWhatsAppNotification implements ShouldQueue
{
    use Queueable;

    public $mobile;
    public $message;
    public $financerId;

    /**
     * Create a new job instance.
     */
    public function __construct($mobile, $message, $financerId = null)
    {
        $this->mobile = $mobile;
        $this->message = $message;
        $this->financerId = $financerId;
    }

    /**
     * Execute the job.
     */
    public function handle(\App\Services\WhatsAppService $whatsApp): void
    {
        $whatsApp->sendMessage($this->mobile, $this->message, $this->financerId);
    }
}
