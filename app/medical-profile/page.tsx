'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MedicalProfile, CBCValues } from '@/types/medical-profile';
import GeneralMedicalForm from '@/components/medical-profile/GeneralMedicalForm';
import CBCForm from '@/components/medical-profile/CBCForm';
import { calculateOverallHealthScore } from '@/utils/calculateHealthScore';
import { useToast } from '@/hooks/useToast';

export default function MedicalProfilePage() {
  const [profile, setProfile] = useState<Partial<MedicalProfile>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');
  const supabase = createClientComponentClient();
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('medical_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      const { data: cbcData, error: cbcError } = await supabase
        .from('cbc_values')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (cbcError) {
        throw cbcError;
      }

      const combinedProfile: Partial<MedicalProfile> = {
        ...profileData,
        cbc_values: cbcData?.[0] || undefined
      };

      setProfile(combinedProfile);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      showToast('Failed to load medical profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
        return;
      }

      // Calculate BMI if height and weight are available
      const bmi = profile.height && profile.weight
        ? (profile.weight / Math.pow(profile.height / 100, 2))
        : undefined;

      // Prepare medical profile data
      const profileData: Partial<MedicalProfile> = {
        user_id: session.user.id,
        height: profile.height,
        weight: profile.weight,
        bmi,
        blood_type: profile.blood_type,
        sex: profile.sex,
        age: profile.age,
        emergency_contact_name: profile.emergency_contact_name,
        emergency_contact_phone: profile.emergency_contact_phone,
        pregnancy: profile.pregnancy,
        cardiac: profile.cardiac,
        pulmonary: profile.pulmonary,
        renal: profile.renal,
        medications: profile.medications,
        diabetes: profile.diabetes,
        smoking: profile.smoking,
        malignancy: profile.malignancy,
        investigations: profile.investigations,
        hyperthyroid: profile.hyperthyroid,
        liver_diseases: profile.liver_diseases,
        health_score: calculateOverallHealthScore(profile as MedicalProfile),
        updated_at: new Date().toISOString()
      };

      // Update medical profile
      const { error: profileError } = await supabase
        .from('medical_profiles')
        .upsert(profileData);

      if (profileError) throw profileError;

      // Update CBC values if they exist
      if (profile.cbc_values) {
        const cbcData = {
          id: profile.cbc_values.id, // Include the ID if it exists
          user_id: session.user.id,
          rbc: profile.cbc_values.rbc,
          haemoglobin: profile.cbc_values.haemoglobin,
          pcv: profile.cbc_values.pcv,
          mcv: profile.cbc_values.mcv,
          mch: profile.cbc_values.mch,
          mchc: profile.cbc_values.mchc,
          total_wbc: profile.cbc_values.total_wbc,
          neutrophils: profile.cbc_values.neutrophils,
          lymphocytes: profile.cbc_values.lymphocytes,
          monocytes: profile.cbc_values.monocytes,
          eosinophils: profile.cbc_values.eosinophils,
          basophils: profile.cbc_values.basophils,
          immature_granulocytes: profile.cbc_values.immature_granulocytes,
          assessment_date: profile.cbc_values.assessment_date || new Date().toISOString(),
          created_at: profile.cbc_values.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // First, try to update if ID exists
        if (cbcData.id) {
          const { error: updateError } = await supabase
            .from('cbc_values')
            .update(cbcData)
            .eq('id', cbcData.id);

          if (updateError) {
            throw updateError;
          }
        } else {
          // If no ID, insert new record
          const { error: insertError } = await supabase
            .from('cbc_values')
            .insert([cbcData]);

          if (insertError) {
            throw insertError;
          }
        }
      }

      showToast('Medical profile updated successfully', 'success');
      router.refresh();
    } catch (error: any) {
      console.error('Error updating profile:', error.message);
      showToast(error.message || 'Failed to update medical profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Medical Profile</h1>
          {profile.health_score && (
            <div className="mt-2">
              <span className="text-sm text-gray-500">Health Score: </span>
              <span className={`text-lg font-semibold ${
                profile.health_score >= 0.8 ? 'text-green-600' :
                profile.health_score >= 0.6 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {(profile.health_score * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('general')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'general'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              General Information
            </button>
            <button
              onClick={() => setActiveTab('cbc')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'cbc'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              CBC Values
            </button>
          </nav>
        </div>

        <div className="mt-6">
          {activeTab === 'general' ? (
            <GeneralMedicalForm
              profile={profile}
              onChange={(updatedProfile) => setProfile(updatedProfile)}
            />
          ) : (
            <CBCForm
                values={profile.cbc_values || {}}
                onChange={(updatedCBC) => {
                  setProfile((prev) => ({
                    ...prev,
                    cbc_values: {
                      ...(prev.cbc_values || {}),
                      ...updatedCBC,
                    } as CBCValues,
                  }));
                }}
              />
          )}
        </div>
      </div>
    </div>
  );
}
