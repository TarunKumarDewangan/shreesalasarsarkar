<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Borrower;
use App\Models\Loan;
use App\Models\Recovery;

class TrashController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $financerId = $user->isAdmin() ? null : ($user->isStaff() ? $user->financer_id : $user->id);
        $exact = $request->exact_date;
        $start = $request->start_date;
        $end   = $request->end_date;

        $queryFn = function($q) use ($financerId, $exact, $start, $end) {
            $q->onlyTrashed();
            if ($financerId) $q->where('financer_id', $financerId);
            if ($exact)      $q->whereDate('deleted_at', $exact);
            if ($start && $end) $q->whereBetween('deleted_at', [$start.' 00:00:00', $end.' 23:59:59']);
            return $q;
        };

        $borrowers = $queryFn(Borrower::query())->get();
        $loans = $queryFn(Loan::query())->with('borrower')->get();
        $recoveries = $queryFn(Recovery::query())->with(['borrower', 'staff'])->get();

        return response()->json([
            'borrowers'  => $borrowers,
            'loans'      => $loans,
            'recoveries' => $recoveries,
        ]);
    }

    public function restore(Request $request, $type, $id)
    {
        $model = $this->getModel($type, $id, true);
        if (!$model) return response()->json(['message' => 'Not found'], 404);

        $this->authorizeAccess($request, $model);
        $model->restore();

        return response()->json(['message' => 'Restored successfully']);
    }

    public function forceDelete(Request $request, $type, $id)
    {
        $model = $this->getModel($type, $id, true);
        if (!$model) return response()->json(['message' => 'Not found'], 404);

        $this->authorizeAccess($request, $model);
        $model->forceDelete();

        return response()->json(['message' => 'Permanently deleted']);
    }

    private function getModel($type, $id, $trashedOnly = false)
    {
        $query = match ($type) {
            'borrowers'  => Borrower::query(),
            'loans'      => Loan::query(),
            'recoveries' => Recovery::query(),
            default      => null,
        };

        if (!$query) return null;
        if ($trashedOnly) $query->onlyTrashed();

        return $query->find($id);
    }

    private function authorizeAccess(Request $request, $model): void
    {
        $user = $request->user();
        if ($user->isAdmin()) return;

        $effectiveOwnerId = $user->isStaff() ? $user->financer_id : $user->id;
        $modelFinancerId = $model->financer_id;

        if ($modelFinancerId !== $effectiveOwnerId) {
            abort(403, 'Access denied.');
        }
    }
}
