<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Loan;
use App\Models\Borrower;
use App\Services\WhatsAppService;
use Illuminate\Http\Request;

class LoanController extends Controller
{
    public function index(Request $request)
    {
        $user  = $request->user();
        $query = Loan::with(['borrower.vehicle', 'financer'])
            ->withCount([
                'installments as total_installments',
                'installments as paid_installments' => fn($q) => $q->where('status', 'PAID'),
                'installments as pending_installments' => fn($q) => $q->where('status', 'PENDING')
            ])
            ->when(! $user->isAdmin(), function($q) use ($user) {
                $ownerId = $user->isStaff() ? $user->financer_id : $user->id;
                return $q->where('financer_id', $ownerId);
            });

        if ($search = $request->search) {
            $query->whereHas('borrower', function($q) use ($search) {
                $q->where('name', 'like', "%$search%")
                  ->orWhere('mobile', 'like', "%$search%")
                  ->orWhere('folio_no', 'like', "%$search%")
                  ->orWhereHas('vehicle', function($v) use ($search) {
                      $v->where('vehicle_no', 'like', "%$search%");
                  });
            });
        }

        if ($request->filled('exact_date')) {
            $query->whereDate('agreement_date', $request->exact_date);
        }

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('agreement_date', [$request->start_date, $request->end_date]);
        }

        if ($request->filled('min_pending')) {
            $query->has('installments', '>=', $request->min_pending, 'and', function($q) {
                $q->where('status', '!=', 'PAID')
                  ->whereDate('due_date', '<=', now());
            });
        }

        if ($request->filled('recovery_man_id')) {
            $query->whereHas('borrower', function($q) use ($request) {
                $q->where('recovery_man_id', $request->recovery_man_id);
            });
        }

        return response()->json($query->orderBy('id', 'desc')->paginate(20));
    }

    /**
     * Preview calculation only – does NOT save.
     */
    public function calculate(Request $request)
    {
        $data = $request->validate([
            'finance_amount'   => 'required|numeric|min:0',
            'agreement_amount' => 'nullable|numeric|min:0',
            'hire_purchase_rto'=> 'nullable|numeric|min:0',
            'total_months'     => 'required|integer|min:1',
            'interval'         => 'nullable|integer|min:1',
            'interest_rate'    => 'required|numeric|min:0',
        ]);

        return response()->json(Loan::calculate($data));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'borrower_id'      => 'required|exists:borrowers,id',
            'type'             => 'required|in:CASH,ONLINE',
            'agreement_date'   => 'required|date',
            'finance_amount'   => 'required|numeric|min:0',
            'agreement_amount' => 'nullable|numeric|min:0',
            'hire_purchase_rto'=> 'nullable|numeric|min:0',
            'total_months'     => 'required|integer|min:1',
            'interval'         => 'nullable|integer|min:1',
            'interest_rate'    => 'required|numeric|min:0',
        ]);

        $user = $request->user();
        if ($user->isAdmin()) {
            $data['financer_id'] = $request->financer_id ?? Borrower::findOrFail($data['borrower_id'])->financer_id;
        } else {
            $data['financer_id'] = $user->isStaff() ? $user->financer_id : $user->id;
        }

        $data = Loan::calculate($data);
        $data['status'] = 'ACTIVE'; // Set initial status
        $loan = Loan::create($data);
        $loan->generateInstallments();

        if ($request->boolean('send_whatsapp')) {
            $loan->load('borrower'); // Ensure borrower is loaded
            if ($loan->borrower && $loan->borrower->mobile) {
                $this->sendWhatsAppNotification($loan);
            }
        }

        return response()->json($loan->load(['borrower', 'installments']), 201);
    }

    public function sendNotification(Request $request, Loan $loan)
    {
        $this->authorizeAccess($request, $loan);
        
        if (!$loan->borrower || !$loan->borrower->mobile) {
            return response()->json(['message' => 'Borrower mobile number not found.'], 422);
        }

        $res = $this->sendWhatsAppNotification($loan);

        if ($res['success']) {
            return response()->json(['message' => 'Notification sent successfully.']);
        }

        return response()->json(['message' => 'Failed to send notification: ' . $res['message']], 500);
    }

    public function approve(Request $request, Loan $loan)
    {
        $this->authorizeAccess($request, $loan);
        $loan->update(['status' => 'ACTIVE']);
        
        if ($loan->installments()->count() === 0) {
            $loan->generateInstallments();
        }

        if ($request->boolean('send_whatsapp') && $loan->borrower && $loan->borrower->mobile) {
            $this->sendWhatsAppNotification($loan);
        }

        return response()->json(['message' => 'Loan approved successfully.', 'loan' => $loan->load('borrower')]);
    }

    public function reject(Request $request, Loan $loan)
    {
        $this->authorizeAccess($request, $loan);
        $loan->update(['status' => 'REJECTED']);
        return response()->json(['message' => 'Loan rejected successfully.', 'loan' => $loan->load('borrower')]);
    }

    private function sendWhatsAppNotification(Loan $loan)
    {
        $whatsApp = new WhatsAppService();
        $nextInstallment = $loan->installments()->where('status', 'PENDING')->orderBy('due_date')->first();
        $nextDate = $nextInstallment ? \Carbon\Carbon::parse($nextInstallment->due_date)->format('d-m-Y') : 'N/A';
        
        $msg = "नमस्ते *" . $loan->borrower->name . "*,\n\n" .
               "आपकी *₹" . number_format((float)$loan->gross_amount, 2) . "* की फाइनेंस राशि *" . $loan->total_installments . " किश्तों* के लिए स्वीकृत हो गई है।\n" .
               "अनुबंध तिथि: *" . \Carbon\Carbon::parse($loan->agreement_date)->format('d-m-Y') . "*\n" .
               "अगली किस्त की तिथि: *" . $nextDate . "*\n" .
               "किस्त राशि: *₹" . number_format((float)$loan->installment_amount, 2) . "* (हर *" . ($loan->interval > 1 ? $loan->interval . " महीने" : "महीने") . "* में)\n\n" .
               "कंपनी: *Shree Salasar Sarkar Finance*\n" .
               "संपर्क: *90744466566*\n\n" .
               "अपने खाते की जानकारी के लिए यहाँ क्लिक करें: http://localhost:5173/borrower/login\n" .
               "धन्यवाद!";
        
        return $whatsApp->sendMessage($loan->borrower->mobile, $msg, $loan->financer_id);
    }

    public function show(Request $request, Loan $loan)
    {
        $this->authorizeAccess($request, $loan);
        return response()->json($loan->load(['borrower.guarantor', 'borrower.vehicle', 'installments', 'financer']));
    }

    public function update(Request $request, Loan $loan)
    {
        $this->authorizeAccess($request, $loan);

        $data = $request->validate([
            'type'             => 'sometimes|in:CASH,ONLINE',
            'agreement_date'   => 'sometimes|date',
            'finance_amount'   => 'sometimes|numeric|min:0',
            'agreement_amount' => 'nullable|numeric|min:0',
            'hire_purchase_rto'=> 'nullable|numeric|min:0',
            'total_months'     => 'sometimes|integer|min:1',
            'interval'         => 'nullable|integer|min:1',
            'interest_rate'    => 'sometimes|numeric|min:0',
            'status'           => 'sometimes|in:ACTIVE,CLOSED,SEIZED,FINAL,VERIFYING,REJECTED',
        ]);

        $data = Loan::calculate(array_merge($loan->toArray(), $data));
        
        // Only re-generate installments if core financial fields change
        $financialKeys = ['finance_amount', 'agreement_amount', 'hire_purchase_rto', 'total_months', 'interest_rate', 'interval', 'agreement_date'];
        $changed = false;
        foreach ($financialKeys as $key) {
            if (isset($data[$key]) && $data[$key] != $loan->$key) {
                $changed = true;
                break;
            }
        }

        $loan->update($data);
        
        if ($changed) {
            $loan->generateInstallments();
        }

        return response()->json($loan->fresh(['borrower', 'installments']));
    }

    public function settle(Request $request, Loan $loan)
    {
        $this->authorizeAccess($request, $loan);

        $request->validate([
            'collection_amount' => 'required|numeric|min:0',
            'notes'             => 'nullable|string',
        ]);

        // Mark all pending installments as SETTLED
        $loan->installments()->where('status', 'PENDING')->update([
            'status'     => 'SETTLED',
            'notes'      => $request->notes ?? 'Final Settlement',
            'paid_date'  => now(),
            // We don't necessarily update amount_paid for each, 
            // but the user wants to close the loan.
        ]);

        $loan->update(['status' => 'FINAL']);

        return response()->json([
            'message' => 'Loan settled and closed successfully.',
            'loan'    => $loan->load(['borrower', 'installments'])
        ]);
    }

    public function destroy(Request $request, Loan $loan)
    {
        $this->authorizeAccess($request, $loan);
        
        $borrower = $loan->borrower;
        $loan->delete();

        // If borrower has no other active loans, cleanup the borrower case entry too
        if ($borrower && $borrower->loans()->count() === 0) {
            $borrower->delete();
        }

        return response()->json(['message' => 'Loan record removed successfully.']);
    }

    private function authorizeAccess(Request $request, Loan $loan): void
    {
        $user = $request->user();
        if ($user->isAdmin()) return;

        $effectiveOwnerId = $user->isStaff() ? $user->financer_id : $user->id;

        if ($loan->financer_id !== $effectiveOwnerId) {
            abort(403, 'Access denied.');
        }
    }
}
