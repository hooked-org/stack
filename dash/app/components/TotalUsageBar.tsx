export default function TotalUsageBar({ total, tier }: { total: { received: number, sent: number }, tier: number }) {
  return (
    <div className="border border-gray-100 bg-white rounded-xl p-5 col-span-2">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg">Total Usage</h3>
        <h3 className="text-sm text-blue-500 hover:text-blue-600">Upgrade Plan</h3>
      </div>

      <div className="flex gap-12">
        <div className="flex-1">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Received Events</span>
            <span className="text-gray-500">{total.received.toLocaleString()} / {tier.toLocaleString()}</span>
          </div>
          <div className="bg-gray-50 h-2 rounded-lg overflow-hidden">
            <div className="bg-indigo-500 rounded-lg h-full" style={{ width: `${(total.received / tier) * 100}%` }} />
          </div>
        </div>

        <div className="flex-1">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Sent Events</span>
            <span className="text-gray-500">{total.sent.toLocaleString()} / {tier.toLocaleString()}</span>
          </div>
          <div className="bg-gray-50 h-2 rounded-lg overflow-hidden">
            <div className="bg-blue-500 rounded-lg h-full" style={{ width: `${(total.sent / tier) * 100}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}