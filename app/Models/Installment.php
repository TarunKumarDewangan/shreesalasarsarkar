<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Installment extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'loan_id', 'due_date', 'amount_due', 'status', 'receipt_no',
        'principal_amount', 'interest_amount', 'balance',
        'paid_date', 'penalty', 'discount', 'amount_paid', 'method', 'notes',
    ];

    protected $casts = [
        'due_date'  => 'date',
        'paid_date' => 'date',
    ];

    public function loan()
    {
        return $this->belongsTo(Loan::class);
    }

    public function recoveries()
    {
        return $this->hasMany(Recovery::class);
    }

    public function sendPaymentWhatsApp()
    {
        $borrower = $this->loan->borrower;
        if (!$borrower || !$borrower->mobile) return ['success' => false, 'message' => 'No mobile'];

        $loan = $this->loan;
        $nextDue = $loan->installments()->where('status', 'PENDING')->orderBy('due_date')->first();
        $nextDate = $nextDue ? \Carbon\Carbon::parse($nextDue->due_date)->format('d-m-Y') : 'N/A';
        $paidDueDate = \Carbon\Carbon::parse($this->due_date)->format('d-m-Y');

        $msg = "नमस्ते *" . $borrower->name . "*,\n\n" .
               "आपके *₹" . number_format($this->amount_paid) . "* का भुगतान रसीद नंबर *" . ($this->receipt_no ?? 'N/A') . "* के साथ प्राप्त हो गया है।\n" .
               "किस्त की देय तिथि: *" . $paidDueDate . "*\n" .
               "अगली किस्त की देय तिथि: *" . $nextDate . "*\n\n" .
               "अपने खाते की जानकारी के लिए यहाँ क्लिक करें: http://localhost:5173/borrower/login\n\n" .
               "धन्यवाद!\n" .
               "*" . ($loan->financer->finance_name ?? 'Shree Salasar Sarkar Finance') . "*";

        \App\Jobs\SendWhatsAppNotification::dispatch($borrower->mobile, $msg, $loan->financer_id);
        return ['success' => true, 'message' => 'Job dispatched'];
    }

    public function sendReminderWhatsApp($daysLeft)
    {
        $borrower = $this->loan->borrower;
        if (!$borrower || !$borrower->mobile) return ['success' => false, 'message' => 'No mobile'];

        $loan = $this->loan;
        $dueDate = \Carbon\Carbon::parse($this->due_date)->format('d-m-Y');
        
        $msg = "नमस्ते *" . $borrower->name . "*,\n\n" .
               "यह एक अनुस्मारक (Reminder) है कि आपकी किस्त राशि *₹" . number_format($this->amount_due) . "* जो दिनांक *" . $dueDate . "* को देय है।\n" .
               "कृपया समय पर भुगतान सुनिश्चित करें ताकि किसी भी विलंब शुल्क (Penalty) से बचा जा सके।\n\n" .
               "अपने खाते की जानकारी के लिए यहाँ क्लिक करें: http://localhost:5173/borrower/login\n\n" .
               "धन्यवाद!\n" .
               "*" . ($loan->financer->finance_name ?? 'Shree Salasar Sarkar Finance') . "*";

        \App\Jobs\SendWhatsAppNotification::dispatch($borrower->mobile, $msg, $loan->financer_id);
        return ['success' => true, 'message' => 'Job dispatched'];
    }
}
