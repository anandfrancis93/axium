'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import HamburgerMenu from '@/components/HamburgerMenu'
import { RefreshIcon } from '@/components/icons'

export default function AuditPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [decisions, setDecisions] = useState<any[]>([])
  const [filter, setFilter] = useState<'all' | 'arm_selection' | 'reward_calculation' | 'mastery_update' | 'data_deletion'>('all')
  const [selectedDecision, setSelectedDecision] = useState<any>(null)

  useEffect(() => {
    loadDecisions()
  }, [filter])

  const loadDecisions = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      let query = supabase
        .from('rl_decision_log')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)

      if (filter !== 'all') {
        query = query.eq('decision_type', filter)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error loading decisions:', error)
      } else {
        setDecisions(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDecisionTypeColor = (type: string) => {
    switch (type) {
      case 'arm_selection':
        return 'text-blue-400'
      case 'reward_calculation':
        return 'text-green-400'
      case 'mastery_update':
        return 'text-purple-400'
      case 'data_deletion':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200">
      {/* Header */}
      <div className="neuro-container mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-200">RL Decision Audit Log</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => loadDecisions()}
              className="neuro-btn text-blue-400 px-4 py-2 text-sm"
              disabled={loading}
            >
              <RefreshIcon size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <HamburgerMenu />
          </div>
        </div>
      </div>

      <div className="neuro-container">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Filters and List */}
          <div className="lg:col-span-1">
            <div className="neuro-card mb-6">
              <h2 className="text-xl font-semibold text-gray-200 mb-4">Filters</h2>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`neuro-btn text-sm py-2 ${filter === 'all' ? 'text-blue-400' : 'text-gray-400'}`}
                >
                  All Decisions ({decisions.length})
                </button>
                <button
                  onClick={() => setFilter('arm_selection')}
                  className={`neuro-btn text-sm py-2 ${filter === 'arm_selection' ? 'text-blue-400' : 'text-gray-400'}`}
                >
                  Arm Selection
                </button>
                <button
                  onClick={() => setFilter('reward_calculation')}
                  className={`neuro-btn text-sm py-2 ${filter === 'reward_calculation' ? 'text-green-400' : 'text-gray-400'}`}
                >
                  Reward Calculation
                </button>
                <button
                  onClick={() => setFilter('mastery_update')}
                  className={`neuro-btn text-sm py-2 ${filter === 'mastery_update' ? 'text-purple-400' : 'text-gray-400'}`}
                >
                  Mastery Update
                </button>
                <button
                  onClick={() => setFilter('data_deletion')}
                  className={`neuro-btn text-sm py-2 ${filter === 'data_deletion' ? 'text-red-400' : 'text-gray-400'}`}
                >
                  Data Deletion
                </button>
              </div>
            </div>

            <div className="neuro-card">
              <h2 className="text-xl font-semibold text-gray-200 mb-4">Recent Decisions</h2>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {decisions.map((decision) => (
                  <button
                    key={decision.id}
                    onClick={() => setSelectedDecision(decision)}
                    className={`neuro-btn w-full text-left p-3 ${
                      selectedDecision?.id === decision.id ? 'ring-2 ring-blue-400' : ''
                    }`}
                  >
                    <div className={`text-sm font-medium ${getDecisionTypeColor(decision.decision_type)}`}>
                      {decision.decision_type.replace('_', ' ').toUpperCase()}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(decision.created_at).toLocaleString()}
                    </div>
                    {decision.decision_type === 'arm_selection' && decision.selected_arm && (
                      <div className="text-xs text-gray-400 mt-1">
                        {decision.selected_arm.topic_name} (Bloom {decision.selected_arm.bloom_level})
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Decision Details */}
          <div className="lg:col-span-2">
            {selectedDecision ? (
              <div className="neuro-card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-2xl font-semibold ${getDecisionTypeColor(selectedDecision.decision_type)}`}>
                    {selectedDecision.decision_type.replace('_', ' ').toUpperCase()}
                  </h2>
                  <span className="text-sm text-gray-500">
                    {new Date(selectedDecision.created_at).toLocaleString()}
                  </span>
                </div>

                {/* Arm Selection Details */}
                {selectedDecision.decision_type === 'arm_selection' && (
                  <div className="space-y-6">
                    {selectedDecision.selection_reasoning && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-300 mb-2">Reasoning</h3>
                        <div className="neuro-inset p-4 rounded-lg text-sm text-gray-400">
                          {selectedDecision.selection_reasoning}
                        </div>
                      </div>
                    )}

                    {selectedDecision.selected_arm && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-300 mb-2">Selected Arm</h3>
                        <div className="neuro-inset p-4 rounded-lg">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Topic:</span>
                              <span className="text-gray-200 ml-2">{selectedDecision.selected_arm.topic_name}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Bloom Level:</span>
                              <span className="text-gray-200 ml-2">{selectedDecision.selected_arm.bloom_level}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Sampled Value:</span>
                              <span className="text-gray-200 ml-2">{selectedDecision.selected_arm.sampled_value?.toFixed(3)}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Adjusted Value:</span>
                              <span className="text-blue-400 ml-2 font-semibold">{selectedDecision.selected_arm.adjusted_value?.toFixed(3)}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Mastery Score:</span>
                              <span className="text-gray-200 ml-2">{selectedDecision.selected_arm.mastery_score?.toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedDecision.all_arms && selectedDecision.all_arms.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-300 mb-2">
                          All Arms Considered ({selectedDecision.all_arms.length})
                        </h3>
                        <div className="neuro-inset p-4 rounded-lg max-h-[400px] overflow-y-auto">
                          <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-[#0a0a0a]">
                              <tr>
                                <th className="text-left text-gray-500 pb-2">Topic</th>
                                <th className="text-center text-gray-500 pb-2">Bloom</th>
                                <th className="text-right text-gray-500 pb-2">Sample</th>
                                <th className="text-right text-gray-500 pb-2">Adjusted</th>
                                <th className="text-right text-gray-500 pb-2">Mastery</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedDecision.all_arms
                                .sort((a: any, b: any) => b.adjusted_value - a.adjusted_value)
                                .map((arm: any, idx: number) => (
                                  <tr
                                    key={idx}
                                    className={arm.topic_id === selectedDecision.selected_arm?.topic_id && arm.bloom_level === selectedDecision.selected_arm?.bloom_level ? 'bg-blue-900/20' : ''}
                                  >
                                    <td className="text-gray-300 py-2">{arm.topic_name}</td>
                                    <td className="text-center text-gray-400">{arm.bloom_level}</td>
                                    <td className="text-right text-gray-400">{arm.sampled_value?.toFixed(3)}</td>
                                    <td className="text-right text-blue-400 font-semibold">{arm.adjusted_value?.toFixed(3)}</td>
                                    <td className="text-right text-gray-400">{arm.mastery_score?.toFixed(1)}%</td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Reward Calculation Details */}
                {selectedDecision.decision_type === 'reward_calculation' && selectedDecision.reward_components && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-300 mb-2">Response</h3>
                      <div className="neuro-inset p-4 rounded-lg grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Correct:</span>
                          <span className={`ml-2 ${selectedDecision.is_correct ? 'text-green-400' : 'text-red-400'}`}>
                            {selectedDecision.is_correct ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Confidence:</span>
                          <span className="text-gray-200 ml-2">{selectedDecision.confidence}/5</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Response Time:</span>
                          <span className="text-gray-200 ml-2">{selectedDecision.response_time_seconds}s</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-300 mb-2">Reward Breakdown</h3>
                      <div className="neuro-inset p-4 rounded-lg space-y-2 text-sm">
                        {Object.entries(selectedDecision.reward_components).map(([key, value]: [string, any]) => (
                          <div key={key} className="flex justify-between">
                            <span className="text-gray-400 capitalize">{key.replace('_', ' ')}:</span>
                            <span className={`font-semibold ${value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {value.toFixed(3)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Mastery Update Details */}
                {selectedDecision.decision_type === 'mastery_update' && (
                  <div className="space-y-6">
                    <div className="neuro-inset p-4 rounded-lg">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-sm text-gray-500 mb-1">Old Mastery</div>
                          <div className="text-2xl font-bold text-gray-300">{selectedDecision.old_mastery?.toFixed(1)}%</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500 mb-1">→</div>
                          <div className="text-2xl font-bold text-blue-400">
                            {selectedDecision.new_mastery > selectedDecision.old_mastery ? '+' : ''}
                            {(selectedDecision.new_mastery - selectedDecision.old_mastery).toFixed(1)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500 mb-1">New Mastery</div>
                          <div className="text-2xl font-bold text-green-400">{selectedDecision.new_mastery?.toFixed(1)}%</div>
                        </div>
                      </div>
                    </div>

                    {selectedDecision.mastery_formula && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-300 mb-2">Formula</h3>
                        <div className="neuro-inset p-4 rounded-lg text-sm font-mono text-gray-400">
                          {selectedDecision.mastery_formula}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Data Deletion Details */}
                {selectedDecision.decision_type === 'data_deletion' && (
                  <div className="space-y-6">
                    {selectedDecision.selection_reasoning && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-300 mb-2">Reason</h3>
                        <div className="neuro-inset p-4 rounded-lg text-sm text-gray-400">
                          {selectedDecision.selection_reasoning}
                        </div>
                      </div>
                    )}

                    {selectedDecision.state_snapshot && (
                      <>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-300 mb-2">Scope</h3>
                          <div className="neuro-inset p-4 rounded-lg text-sm">
                            <span className="text-gray-400 capitalize">
                              {selectedDecision.state_snapshot.scope?.replace('_', ' ')}
                            </span>
                            {selectedDecision.state_snapshot.chapter_id && (
                              <div className="text-xs text-gray-500 mt-1">
                                Chapter ID: {selectedDecision.state_snapshot.chapter_id}
                              </div>
                            )}
                            {selectedDecision.topic_id && (
                              <div className="text-xs text-gray-500">
                                Topic ID: {selectedDecision.topic_id}
                              </div>
                            )}
                            {selectedDecision.bloom_level && (
                              <div className="text-xs text-gray-500">
                                Bloom Level: {selectedDecision.bloom_level}
                              </div>
                            )}
                          </div>
                        </div>

                        {selectedDecision.state_snapshot.deleted_counts && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-300 mb-2">Records Deleted</h3>
                            <div className="neuro-inset p-4 rounded-lg">
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                {Object.entries(selectedDecision.state_snapshot.deleted_counts).map(([key, value]: [string, any]) => (
                                  <div key={key} className="flex justify-between">
                                    <span className="text-gray-400 capitalize">{key}:</span>
                                    <span className="text-red-400 font-semibold">{value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {selectedDecision.state_snapshot.data_snapshot && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-300 mb-2">Data Snapshot</h3>
                            <div className="neuro-inset p-4 rounded-lg">
                              <div className="text-xs text-gray-500 mb-2">
                                Full snapshot of deleted data (for recovery/audit)
                              </div>
                              <div className="text-xs font-mono text-gray-600 max-h-64 overflow-y-auto">
                                {Object.entries(selectedDecision.state_snapshot.data_snapshot).map(([key, value]: [string, any]) => (
                                  <div key={key} className="mb-2">
                                    <div className="text-gray-400">{key}: {Array.isArray(value) ? `${value.length} records` : 'N/A'}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="neuro-card flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <p className="text-lg">Select a decision to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
