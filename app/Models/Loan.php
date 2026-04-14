<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Loan extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'borrower_id', 'financer_id', 'type', 'agreement_date',
        'finance_amount', 'agreement_amount', 'hire_purchase_rto',
        'gross_amount', 'total_months', 'interest_rate', 'interval',
        'interest_amount', 'total_amount', 'installment_rate', 'status',
    ];

    protected $appends = ['installment_amount', 'total_installments'];

    protected $casts = [
        'agreement_date' => 'date',
        'finance_amount' => 'decimal:2',
        'agreement_amount' => 'decimal:2',
        'hire_purchase_rto' => 'decimal:2',
        'gross_amount' => 'decimal:2',
        'interest_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'installment_rate' => 'decimal:2',
        'interest_rate' => 'decimal:2',
        'total_months' => 'integer',
        'interval' => 'integer',
    ];

    /**
     * Calculate EMI fields from base values.
     */
    public static function calculate(array $data): array
    {
        $gross = ($data['finance_amount'] ?? 0)
               + ($data['agreement_amount'] ?? 0)
               + ($data['hire_purchase_rto'] ?? 0);

        $months = $data['total_months'] ?? 12;
        $rate   = $data['interest_rate'] ?? 0;

        $interest = ($gross * $rate * $months) / 1200;
        $total    = $gross + $interest;
        $emi      = $months > 0 ? $total / $months : 0;

        return array_merge($data, [
            'gross_amount'     => round($gross, 2),
            'interest_amount'  => round($interest, 2),
            'total_amount'     => round($total, 2),
            'installment_rate' => round($emi, 2),
        ]);
    }

    public function borrower()
    {
        return $this->belongsTo(Borrower::class);
    }

    public function financer()
    {
        return $this->belongsTo(User::class, 'financer_id');
    }

    public function installments()
    {
        return $this->hasMany(Installment::class);
    }

    /**
     * Generate monthly installment records for this loan.
     */
    public function generateInstallments(): void
    {
        $this->installments()->delete();

        $date = \Carbon\Carbon::parse($this->agreement_date);
        $interval = $this->interval ?: 1;
        $numberOfInstallments = max(1, floor($this->total_months / $interval));

        $installmentAmount = round($this->installment_rate * $interval, 2);
        $principalPerIns = round($this->gross_amount / $numberOfInstallments, 2);
        $interestPerIns  = round(($this->total_amount - $this->gross_amount) / $numberOfInstallments, 2);
        
        $currentBalance = $this->total_amount;

        for ($i = 1; $i <= $numberOfInstallments; $i++) {
            $date->addMonths($interval);
            
            // Adjust last installment to account for any rounding logic discrepancies
            if ($i == $numberOfInstallments) {
                $installmentAmount = round($currentBalance, 2);
            }
            
            $currentBalance -= $installmentAmount;
            
            $this->installments()->create([
                'due_date'         => $date->toDateString(),
                'amount_due'       => $installmentAmount,
                'principal_amount' => $principalPerIns,
                'interest_amount'  => $interestPerIns,
                'balance'          => round(max(0, $currentBalance), 2),
                'status'           => 'PENDING',
            ]);
        }
    }

    public function getTotalInstallmentsAttribute()
    {
        $interval = $this->interval ?: 1;
        return max(1, floor($this->total_months / $interval));
    }

    public function getInstallmentAmountAttribute()
    {
        $interval = $this->interval ?: 1;
        return round($this->installment_rate * $interval, 2);
    }

    public function nextPendingInstallment()
    {
        return $this->hasOne(Installment::class)->where('status', 'PENDING')->oldest('due_date');
    }

    /**
     * Update loan status based on pending installments.
     */
    public function updateStatus(): void
    {
        $pendingCount = $this->installments()->where('status', 'PENDING')->count();
        if ($pendingCount === 0) {
            $this->update(['status' => 'CLOSED']);
        } else {
            $this->update(['status' => 'ACTIVE']);
        }
    }

    /**
     * The "booted" method of the model.
     */
    protected static function booted()
    {
        static::deleted(function ($loan) {
            $loan->installments()->delete();
            
            // If the borrower has no other active (non-deleted) loans, delete the borrower too
            $borrower = $loan->borrower;
            if ($borrower && $borrower->loans()->count() === 0) {
                $borrower->delete();
            }
        });

        static::restored(function ($loan) {
            $loan->installments()->restore();
        });
    }
}
