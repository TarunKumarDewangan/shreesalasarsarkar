<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Borrower;
use App\Models\Customer;
use App\Models\Guarantor;
use App\Models\Vehicle;
use Illuminate\Http\Request;

class BorrowerController extends Controller
{
    private function financer_id(Request $request): int
    {
        $user = $request->user();
        if ($user->isAdmin()) return $request->financer_id ?? $user->id;
        if ($user->isStaff()) return $user->financer_id;
        return $user->id;
    }
    public function zones(Request $request)
    {
        $financerId = $this->financer_id($request);
        $zones = Borrower::where('financer_id', $financerId)
            ->whereNotNull('zone')
            ->where('zone', '!=', '')
            ->distinct()
            ->orderBy('zone')
            ->pluck('zone');
            
        return response()->json($zones);
    }

    public function onboardingMetadata(Request $request)
    {
        $financerId = $this->financer_id($request);
        $user = $request->user();

        // 1. Next Folio
        $max = Borrower::withTrashed()
            ->where('financer_id', $financerId)
            ->max('folio_no');
        $next = $max ? (int)$max + 1 : 7426100;

        // 2. Metadata (Zones, Models, Colors, etc.)
        $zones = Borrower::where('financer_id', $financerId)
            ->whereNotNull('zone')->where('zone', '!=', '')
            ->distinct()->orderBy('zone')->pluck('zone');

        $getDistinct = function($col) use ($financerId) {
            return Vehicle::whereHas('borrower', fn($q) => $q->where('financer_id', $financerId))
                ->whereNotNull($col)
                ->where($col, '!=', '')
                ->selectRaw("UPPER(TRIM($col)) as val")
                ->distinct()
                ->orderBy('val')
                ->pluck('val');
        };
        
        $conditions = $getDistinct('condition_type');
        $soldBy     = $getDistinct('sold_by');
        $models     = $getDistinct('model');
        $colors     = $getDistinct('color');

        // 3. Financers list (only for admin, others get restricted list)
        $financers = [];
        if ($user->isAdmin()) {
            $financers = \App\Models\User::where('role', 'financer')->orderBy('name')->get(['id', 'name', 'finance_name']);
        } elseif ($user->isFinancer()) {
            $financers = [$user->only(['id', 'name', 'finance_name'])];
        } elseif ($user->isStaff() && $user->financer) {
            $financers = [$user->financer->only(['id', 'name', 'finance_name'])];
        }

        return response()->json([
            'next_folio' => (string)$next,
            'zones'      => $zones,
            'conditions' => $conditions,
            'sold_by'    => $soldBy,
            'models'     => $models,
            'colors'     => $colors,
            'financers'  => $financers
        ]);
    }

    public function vehicleConditions(Request $request)
    {
        $financerId = $this->financer_id($request);
        $conditions = Vehicle::whereHas('borrower', function ($q) use ($financerId) {
            $q->where('financer_id', $financerId);
        })
            ->whereNotNull('condition_type')
            ->where('condition_type', '!=', '')
            ->selectRaw('UPPER(TRIM(condition_type)) as condition_type')
            ->distinct()
            ->orderBy('condition_type')
            ->pluck('condition_type');
            
        return response()->json($conditions);
    }

    public function vehicleSoldBy(Request $request)
    {
        $financerId = $this->financer_id($request);
        $data = Vehicle::whereHas('borrower', function ($q) use ($financerId) {
            $q->where('financer_id', $financerId);
        })
            ->whereNotNull('sold_by')
            ->where('sold_by', '!=', '')
            ->selectRaw('UPPER(TRIM(sold_by)) as sold_by')
            ->distinct()
            ->orderBy('sold_by')
            ->pluck('sold_by');
            
        return response()->json($data);
    }

    public function vehicleModels(Request $request)
    {
        $financerId = $this->financer_id($request);
        $data = Vehicle::whereHas('borrower', function ($q) use ($financerId) {
            $q->where('financer_id', $financerId);
        })
            ->whereNotNull('model')
            ->where('model', '!=', '')
            ->selectRaw('UPPER(TRIM(model)) as model')
            ->distinct()
            ->orderBy('model')
            ->pluck('model');
            
        return response()->json($data);
    }

    public function vehicleColors(Request $request)
    {
        $financerId = $this->financer_id($request);
        $data = Vehicle::whereHas('borrower', function ($q) use ($financerId) {
            $q->where('financer_id', $financerId);
        })
            ->whereNotNull('color')
            ->where('color', '!=', '')
            ->selectRaw('UPPER(TRIM(color)) as color')
            ->distinct()
            ->orderBy('color')
            ->pluck('color');
            
        return response()->json($data);
    }

    public function index(Request $request)
    {
        $user = $request->user();
        $query = Borrower::with(['recoveryMan', 'guarantor', 'vehicle', 'latestLoan'])
            ->has('loans')
            ->where('financer_id', $this->financer_id($request));

        // If staff and assigned_only toggle is ON, only show assigned borrowers
        if ($user->isStaff() && $request->boolean('assigned_only')) {
            $query->where('recovery_man_id', $user->id);
        }

        if ($search = $request->search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%$search%")
                  ->orWhere('folio_no', 'like', "%$search%")
                  ->orWhere('mobile', 'like', "%$search%")
                  ->orWhereHas('vehicle', function($v) use ($search) {
                      $v->where('vehicle_no', 'like', "%$search%");
                  });
            });
        }

        // Filter by recovery_man
        if ($request->filled('recovery_man_id')) {
            $query->where('recovery_man_id', $request->recovery_man_id);
        }

        // Filter by loan status
        if ($request->filled('status')) {
            $query->whereHas('latestLoan', function($q) use ($request) {
                $q->where('status', $request->status);
                
                // If filtering by SEIZED or other status, apply exact date range if provided
                if ($request->filled('start_date') && $request->filled('end_date')) {
                    $q->whereBetween('updated_at', [
                        $request->start_date . ' 00:00:00',
                        $request->end_date . ' 23:59:59'
                    ]);
                }
            });
        }

        // Filter by date (collection day)
        if ($request->filled('collection_day')) {
            $query->where('collection_day', $request->collection_day);
        }

        if ($request->filled('exact_date')) {
            $query->whereDate('created_at', $request->exact_date);
        }

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('created_at', [$request->start_date . ' 00:00:00', $request->end_date . ' 23:59:59']);
        }

        return response()->json($query->orderBy('id', 'desc')->paginate(20));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            // Borrower
            'recovery_man_id' => 'nullable|exists:users,id',
            'folio_prefix'    => 'required|in:O,S,KC',
            'folio_no'        => 'required|string|max:20',
            'zone'            => 'nullable|string|max:100',
            'collection_day' => 'nullable|string|max:20',
            'name'            => 'required|string|max:255',
            'father_name'     => 'nullable|string|max:255',
            'mobile'          => 'nullable|string|max:20',
            'mobile2'         => 'nullable|string|max:20',
            'aadhar'          => 'nullable|string|max:20',
            'pan'             => 'nullable|string|max:20',
            'dob'             => 'nullable|date',
            'address'         => 'nullable|string',
            'guarantor'            => 'nullable|array',
            'guarantor.name'       => 'nullable|string|max:255',
            'guarantor.father_name'=> 'nullable|string|max:255',
            'guarantor.mobile'     => 'nullable|string|max:20',
            'guarantor.address'    => 'nullable|string',
            'vehicle'                   => 'nullable|array',
            'vehicle.condition_type'    => 'nullable|string|max:50',
            'vehicle.sold_by'           => 'nullable|string|max:255',
            'vehicle.model'             => 'nullable|string|max:255',
            'vehicle.color'             => 'nullable|string|max:100',
            'vehicle.chassis_no'        => 'nullable|string|max:100',
            'vehicle.engine_no'         => 'nullable|string|max:100',
            'vehicle.make_year'         => 'nullable|string|max:20',
            'vehicle.vehicle_no'        => 'nullable|string|max:50',
            'vehicle.insurance_expiry'  => 'nullable|date',
            // Photos (base64)
            'photo_base64'        => 'nullable|string',
            'aadhar_photo_base64' => 'nullable|string',
        ]);

        $financer_id = $this->financer_id($request);

        try {
            $borrower = Borrower::create(array_merge(
                collect($data)->except(['guarantor', 'vehicle'])->toArray(),
                ['financer_id' => $financer_id]
            ));

            Borrower::syncCustomer($borrower);

            if (! empty($data['guarantor']['name'])) {
                $borrower->guarantor()->create($data['guarantor']);
            }
            if (! empty($data['vehicle'])) {
                $borrower->vehicle()->create($data['vehicle']);
            }

            // Handle Photo Uploads
            if ($request->photo_base64) {
                $borrower->photo = $this->saveBase64Image($request->photo_base64, 'borrowers/photos');
            }
            if ($request->aadhar_photo_base64) {
                $borrower->aadhar_photo = $this->saveBase64Image($request->aadhar_photo_base64, 'borrowers/aadhar');
            }
            if ($borrower->isDirty(['photo', 'aadhar_photo'])) {
                $borrower->save();
            }

            return response()->json(
                $borrower->load(['guarantor', 'vehicle', 'recoveryMan']),
                201
            );
        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() == '23000') {
                return response()->json(['message' => 'Folio number already exists for this financer.'], 422);
            }
            throw $e;
        }
    }

    public function show(Request $request, Borrower $borrower)
    {
        $this->authorize('view', $borrower);
        return response()->json($borrower->load(['recoveryMan', 'guarantor', 'vehicle', 'latestLoan' => function($q) {
            $q->withCount([
                'installments as total_installments',
                'installments as paid_installments' => function($iq) {
                    $iq->where('status', 'PAID');
                },
                'installments as pending_installments' => function($iq) {
                    $iq->where('status', 'PENDING');
                }
            ]);
        }]));
    }

    public function update(Request $request, Borrower $borrower)
    {
        $this->authorize('update', $borrower);

        $data = $request->validate([
            'recovery_man_id' => 'nullable|exists:users,id',
            'folio_prefix'    => 'sometimes|in:O,S,KC',
            'folio_no'        => 'sometimes|string|max:20',
            'zone'            => 'nullable|string|max:100',
            'collection_day' => 'nullable|string|max:20',
            'name'            => 'sometimes|string|max:255',
            'father_name'     => 'nullable|string|max:255',
            'mobile'          => 'nullable|string|max:20',
            'mobile2'         => 'nullable|string|max:20',
            'aadhar'          => 'nullable|string|max:20',
            'pan'             => 'nullable|string|max:20',
            'dob'             => 'nullable|date',
            'address'         => 'nullable|string',
            'guarantor'    => 'nullable|array',
            'vehicle'      => 'nullable|array',
            // Photos (base64)
            'photo_base64'        => 'nullable|string',
            'aadhar_photo_base64' => 'nullable|string',
        ]);

        $borrower->update(collect($data)->except(['guarantor', 'vehicle'])->toArray());
        Borrower::syncCustomer($borrower);

        if (isset($data['guarantor'])) {
            $borrower->guarantor
                ? $borrower->guarantor->update($data['guarantor'])
                : $borrower->guarantor()->create($data['guarantor']);
        }
        if (isset($data['vehicle'])) {
            $borrower->vehicle
                ? $borrower->vehicle->update($data['vehicle'])
                : $borrower->vehicle()->create($data['vehicle']);
        }

        // Handle Photo Updates
        if ($request->photo_base64) {
            $borrower->photo = $this->saveBase64Image($request->photo_base64, 'borrowers/photos');
        }
        if ($request->aadhar_photo_base64) {
            $borrower->aadhar_photo = $this->saveBase64Image($request->aadhar_photo_base64, 'borrowers/aadhar');
        }
        if ($borrower->isDirty(['photo', 'aadhar_photo'])) {
            $borrower->save();
        }

        return response()->json($borrower->fresh(['guarantor', 'vehicle']));
    }

    public function destroy(Request $request, Borrower $borrower)
    {
        $this->authorize('delete', $borrower);
        $borrower->delete();
        return response()->json(['message' => 'Borrower deleted.']);
    }

    public function nextFolio(Request $request)
    {
        $max = Borrower::withTrashed()
            ->where('financer_id', $this->financer_id($request))
            ->max('folio_no');
        $next = $max ? (int)$max + 1 : 7426100;
        return response()->json(['next' => (string)$next]);
    }

    private function saveBase64Image($base64, $folder)
    {
        if (preg_match('/^data:image\/(\w+);base64,/', $base64, $type)) {
            $data = substr($base64, strpos($base64, ',') + 1);
            $type = strtolower($type[1]); // jpg, png, etc

            if (!in_array($type, ['jpg', 'jpeg', 'gif', 'png'])) {
                return null;
            }

            $data = base64_decode($data);
            if ($data === false) return null;

            $fileName = uniqid() . '.' . $type;
            $path = $folder . '/' . $fileName;

            \Illuminate\Support\Facades\Storage::disk('public')->put($path, $data);
            return '/storage/' . $path;
        }
        return null;
    }


}
