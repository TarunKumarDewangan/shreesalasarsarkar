<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class BacklogInstallment extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'backlog_account_id', 'fno', 'rno', 'installment_no', 'due_date',
        'payment_date', 'installment_amount', 'paid_amount', 'principal_amount',
        'interest_amount', 'fine_amount', 'exc_amount', 'balance_amount',
        'mode', 'status', 'cheque_no', 'coverage', 'rate_per_day', 'im', 'notes',
    ];

    public function account()
    {
        return $this->belongsTo(BacklogAccount::class, 'backlog_account_id');
    }
}
