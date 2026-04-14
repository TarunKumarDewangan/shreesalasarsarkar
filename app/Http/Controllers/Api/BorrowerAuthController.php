<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Borrower;
use App\Services\WhatsAppService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class BorrowerAuthController extends Controller
{
    public function sendOTP(Request $request)
    {
        $request->validate(['mobile' => 'required']);
        $mobile = preg_replace('/[^0-9]/', '', $request->mobile);
        
        // Match last 10 digits
        $borrower = Borrower::where('mobile', 'like', '%' . substr($mobile, -10))->first();
        
        if (!$borrower) {
            return response()->json(['message' => 'Mobile number not registered.'], 404);
        }

        $otp = str_pad(random_int(0, 9999), 4, '0', STR_PAD_LEFT);
        $borrower->update([
            'otp' => $otp,
            'otp_expires_at' => Carbon::now()->addMinutes(10)
        ]);

        $msg = "नमस्ते *" . $borrower->name . "*,\n\n" .
               "आपका लॉगिन OTP *" . $otp . "* है। यह 10 मिनट के लिए मान्य है।\n\n" .
               "लॉगिन करने के लिए यहाँ क्लिक करें: http://localhost:5173/borrower/login\n\n" .
               "धन्यवाद!\n" .
               "*Shree Salasar Sarkar Finance*";
        
        $waMobile = strlen($mobile) === 10 ? '91' . $mobile : $mobile;
        
        $res = (new WhatsAppService())->sendMessage($waMobile, $msg, $borrower->financer_id);

        if ($res['success']) {
            return response()->json(['message' => 'OTP sent successfully.']);
        }

        return response()->json(['message' => 'Failed to send OTP via WhatsApp.'], 500);
    }

    public function login(Request $request)
    {
        $request->validate([
            'mobile' => 'required',
            'type'   => 'required|in:OTP,FOLIO',
            'value'  => 'required'
        ]);

        $mobile = preg_replace('/[^0-9]/', '', $request->mobile);
        $borrower = Borrower::where('mobile', 'like', '%' . substr($mobile, -10))->first();

        if (!$borrower) {
            return response()->json(['message' => 'Invalid mobile or details.'], 401);
        }

        if ($request->type === 'OTP') {
            if ($borrower->otp !== $request->value || Carbon::now()->gt($borrower->otp_expires_at)) {
                return response()->json(['message' => 'Invalid or expired OTP.'], 401);
            }
            // Clear OTP after use
            $borrower->update(['otp' => null, 'otp_expires_at' => null]);
        } else {
            // Folio login
            if ((string)$borrower->folio_no !== $request->value) {
                return response()->json(['message' => 'Invalid Folio number.'], 401);
            }
        }

        $token = $borrower->createToken('borrower-access')->plainTextToken;

        return response()->json([
            'token'    => $token,
            'borrower' => $borrower->load(['latestLoan.financer', 'latestLoan.installments' => function($q) {
                $q->withCount(['recoveries as pending_recovery_count' => function($sq) {
                    $sq->where('status', 'PENDING');
                }]);
            }]),
            'role'     => 'BORROWER'
        ]);
    }
}
