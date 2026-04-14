<?php

namespace App\Console\Commands;

use App\Models\Installment;
use Illuminate\Console\Command;
use Carbon\Carbon;

class SendDueReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:send-due-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send WhatsApp reminders to borrowers 15 days and 2 days before due date';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting due reminders mission...');

        // 15 days reminder
        $date15 = Carbon::today()->addDays(15)->toDateString();
        $ins15 = Installment::where('status', 'PENDING')
            ->whereDate('due_date', $date15)
            ->get();

        $this->info("Found {$ins15->count()} installments due in 15 days ($date15).");
        foreach ($ins15 as $ins) {
            $ins->sendReminderWhatsApp(15);
            $this->comment("Sent 15-day reminder to: " . ($ins->loan->borrower->name ?? 'Unknown'));
        }

        // 2 days reminder
        $date2 = Carbon::today()->addDays(2)->toDateString();
        $ins2 = Installment::where('status', 'PENDING')
            ->whereDate('due_date', $date2)
            ->get();

        $this->info("Found {$ins2->count()} installments due in 2 days ($date2).");
        foreach ($ins2 as $ins) {
            $ins->sendReminderWhatsApp(2);
            $this->comment("Sent 2-day reminder to: " . ($ins->loan->borrower->name ?? 'Unknown'));
        }

        $this->info('Reminders mission completed!');
    }
}
