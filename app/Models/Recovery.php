<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Recovery extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'financer_id', 'staff_id', 'borrower_id', 'amount', 'collection_date', 'status', 'notes',
        'installment_id', 'penalty', 'discount', 'payment_method', 'receipt_no', 'paid_date'
    ];

    public function staff()
    {
        return $this->belongsTo(User::class, 'staff_id');
    }

    public function borrower()
    {
        return $this->belongsTo(Borrower::class);
    }

    public function financer()
    {
        return $this->belongsTo(User::class, 'financer_id');
    }

    public function installment()
    {
        return $this->belongsTo(Installment::class);
    }
}
