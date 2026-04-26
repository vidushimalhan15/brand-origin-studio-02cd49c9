import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import AppSidebar from '@/components/AppSidebar';
import { ValidationDialog } from '@/components/ValidationDialog';
import { CampaignHeader } from '@/components/campaign/CampaignHeader';
import { CampaignStepRenderer } from '@/components/campaign/CampaignStepRenderer';
import { useCampaignState } from '@/hooks/useCampaignState';
import { useCampaignPersistence } from '@/hooks/useCampaignPersistence';
import { validateStepNavigation } from '@/utils/campaignValidation';
import { BrandProfile, ProductDetails } from '@/pages/BrandProductSetup';
import { loadBrandData, loadBrandDataFromSupabase } from '@/utils/brandDataManager';
import { useBrandManager } from '@/contexts/BrandManagerContext';
import { markStepComplete, getStepCompletions, type StepType } from '@/utils/stepCompletion';

export interface ProductList {
  products: ProductDetails[];
}

const Campaign = () => {
  const navigate = useNavigate();
  const { state: brandState, actions: brandActions } = useBrandManager();

  // Use custom hooks for state and persistence
  const campaignState = useCampaignState();
  const {
    currentStep,
    brandProfile,
    productList,
    campaignTimeline,
    postIdeas,
    generatedPosts,
    finalContent,
    campaignName,
    currentBrand,
    formStates,
    steps,
    setCurrentStep,
    setStepHistory,
    setCampaignName,
    updateFormState,
    setBrandProfile,
    setProductList,
    setCurrentBrand,
    setPostIdeas,
    setGeneratedPosts
  } = campaignState;

  // Load brand data from BrandManager context or localStorage
  useEffect(() => {
    const loadData = async () => {
      // Always prefer BrandManager over localStorage
      if (brandState.currentBrandId && brandState.brandData) {
        console.log('📥 Loading brand data from BrandManager context');
        console.log('📥 Audiences from context:', brandState.brandData.audiences);
        console.log('📥 Brand profile data:', brandState.brandData.profile);
        console.log('📥 Introduction field:', brandState.brandData.profile.introduction);

        // Convert brandData to brandProfile format
        const profile = brandState.brandData.profile as any;
        const profileWithAudiences = {
          name: profile.name,
          introduction: profile.introduction,
          websiteUrl: profile.websiteUrl,
          logoUrl: profile.logoUrl,
          customImage: profile.customImage,
          tone: profile.tone,
          voice: profile.voice,
          industryNiches: profile.industryNiches,
          keyMessages: profile.keyMessages,
          extractedInfo: profile.extractedInfo,
          audiences: brandState.brandData.audiences || []
        };

        console.log('📥 Converted profile with introduction:', profileWithAudiences.introduction);
        console.log('🔄 Calling setBrandProfile with:', profileWithAudiences.name);
        setBrandProfile(profileWithAudiences as any);
        setProductList((brandState.brandData.products || []) as ProductDetails[]);

        // Set currentBrand for campaign persistence
        const currentBrandInfo = brandState.brands.find(b => b.id === brandState.currentBrandId);
        if (currentBrandInfo) {
          console.log('🔄 Setting currentBrand:', currentBrandInfo);
          setCurrentBrand({
            id: currentBrandInfo.id,
            name: currentBrandInfo.name,
            type: currentBrandInfo.type || 'business'
          });
        }

        console.log('✅ Set brand profile with audiences from context:', brandState.brandData.audiences?.length || 0);
        console.log('✅ setBrandProfile completed for:', profileWithAudiences.name);
      } else if (brandState.currentBrandId && !brandState.brandData) {
        // Load brand data if we have ID but no data
        console.log('🔄 Loading brand from BrandManager:', brandState.currentBrandId);
        await brandActions.selectBrand(brandState.currentBrandId);
      } else {
        // Fallback: check legacy localStorage only if BrandManager has nothing
        const savedBrand = localStorage.getItem('currentBrand');
        if (savedBrand) {
          try {
            const currentBrandData = JSON.parse(savedBrand);
            console.log('🔄 Fallback: Loading legacy brand into BrandManager:', currentBrandData.id);

            // Immediately set currentBrand from localStorage to prevent "No brandId" errors
            setCurrentBrand({
              id: currentBrandData.id,
              name: currentBrandData.name,
              type: currentBrandData.type || 'business'
            });
            console.log('✅ Set currentBrand from localStorage:', currentBrandData.id);

            // Also load into BrandManager for future use
            await brandActions.selectBrand(currentBrandData.id);
          } catch (error) {
            console.error('🚨 Campaign: Error loading legacy brand data:', error);
          }
        }
      }
    };

    loadData();
  }, [brandState.currentBrandId, brandState.brandData, brandState.brands, setBrandProfile, setProductList, setCurrentBrand, brandActions]);

  // Check for pending campaign step from sidebar navigation
  // Sync currentStep with URL path
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;

    // If user lands on the base /campaign route, redirect to the furthest accessible step
    if (path === '/campaign') {
      const brandId = currentBrand?.id || brandState.currentBrandId;
      console.log('🔄 Landing on /campaign, determining redirect for brand:', brandId);

      if (brandId) {
        const completions = getStepCompletions(brandId);
        if (completions.textGeneration) {
          navigate('/text-generation', { replace: true });
        } else if (completions.postIdeation) {
          navigate('/text-generation', { replace: true });
        } else if (completions.campaignSetup) {
          navigate('/post-ideation', { replace: true });
        } else {
          navigate('/campaign-setup', { replace: true });
        }
      } else {
        navigate('/campaign-setup', { replace: true });
      }
      return;
    }

    if (path === '/post-ideation') {
      setCurrentStep(1);
    } else if (path === '/text-generation') {
      setCurrentStep(2);
    } else if (path === '/campaign-setup') {
      setCurrentStep(0);
    }
  }, [location.pathname, setCurrentStep, brandState.currentBrandId, currentBrand?.id, navigate]);

  const persistence = useCampaignPersistence({
    ...campaignState,
    currentDraft: null,
    setCurrentDraft: () => { }
  });

  const { isSaving, isLoadingData, handleSaveAs, handleStepComplete } = persistence;

  const [validationDialog, setValidationDialog] = useState({
    open: false,
    title: '',
    description: '',
    requirements: [] as Array<{ text: string; completed: boolean }>
  });

  const handleValidationRequired = (title: string, description: string, requirements: Array<{ text: string; completed: boolean }>) => {
    setValidationDialog({
      open: true,
      title,
      description,
      requirements
    });
  };

  const handleStepChangeWithValidation = useCallback((stepIndex: number) => {
    const validation = validateStepNavigation(
      stepIndex,
      currentStep,
      brandProfile,
      productList,
      campaignTimeline,
      postIdeas,
      generatedPosts,
      finalContent
    );

    if (!validation.isValid) {
      setValidationDialog({
        open: true,
        title: 'Complete Previous Steps',
        description: 'Please complete the current step requirements before proceeding.',
        requirements: validation.requirements
      });
      return;
    }

    // Mark the current step as completed when moving forward (user clicked Continue)
    if (stepIndex > currentStep) {
      // Use currentBrand.id if available, otherwise fallback to brandState.currentBrandId
      const brandId = currentBrand?.id || brandState.currentBrandId;
      console.log('📍 Attempting to mark step complete. Current step:', currentStep, 'Brand ID:', brandId);

      if (brandId) {
        const stepNames: StepType[] = ['campaignSetup', 'postIdeation', 'textGeneration']; // 'exportSchedule' removed
        if (currentStep >= 0 && currentStep < stepNames.length) {
          markStepComplete(brandId, stepNames[currentStep]);
          console.log('✅ Marked step as complete:', stepNames[currentStep], 'for brand:', brandId);
        }
      } else {
        console.warn('⚠️ Cannot mark step complete: No brand ID available');
        console.log('⚠️ Current brand state:', currentBrand);
        console.log('⚠️ Brand state from context:', brandState.currentBrandId);
      }
    }

    setCurrentStep(stepIndex);

    // Navigate to the correct URL based on the step
    if (stepIndex === 0) navigate('/campaign-setup');
    else if (stepIndex === 1) navigate('/post-ideation');
    else if (stepIndex === 2) navigate('/text-generation');
  }, [currentStep, brandProfile, productList, campaignTimeline, postIdeas, generatedPosts, finalContent, currentBrand, brandState.currentBrandId, setCurrentStep, navigate]);

  const handlePrevious = useCallback(() => {
    if (currentStep === 1) {
      navigate('/campaign-setup');
    } else if (currentStep === 2) {
      navigate('/post-ideation');
    } else {
      navigate('/brand-product-setup');
    }
  }, [currentStep, navigate]);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      handleStepChangeWithValidation(currentStep + 1);
    }
  }, [currentStep, steps.length, handleStepChangeWithValidation]);

  const handleSaveDraft = useCallback(() => {
    const name = campaignName || 'My Campaign';
    handleSaveAs(name);
  }, [campaignName, handleSaveAs]);

  // Wrapper for updateFormState to handle the "campaignSetup" section
  const handleFormStateChange = useCallback((data: any) => {
    updateFormState('campaignSetup', data);
  }, [updateFormState]);

  // Wrapper for handleStepComplete to handle navigation via URL
  const handleStepCompleteWrapper = useCallback((stepIndex: number, data: any, shouldAdvance: boolean = true) => {
    // Pass false for shouldAdvance to prevent internal state update in useCampaignPersistence
    // We want to control advancement via URL navigation
    handleStepComplete(stepIndex, data, false);

    if (shouldAdvance) {
      if (stepIndex === 0) { // Setup completed -> Ideation
        navigate('/post-ideation');
      } else if (stepIndex === 1) { // Ideation completed -> Text Generation
        navigate('/text-generation');
      }
    }
  }, [handleStepComplete, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AppSidebar
        currentStep={currentStep}
        steps={steps}
        onStepChange={handleStepChangeWithValidation}
        onValidationRequired={handleValidationRequired}
      />

      <div className="flex-1 flex flex-col">
        <CampaignHeader
          currentStep={currentStep}
          steps={steps}
          campaignName={campaignName}
          isSaving={isSaving}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onSaveDraft={handleSaveDraft}
          brandProfile={brandProfile}
          productList={productList}
          campaignTimeline={campaignTimeline}
          postIdeas={postIdeas}
          generatedPosts={generatedPosts}
          finalContent={finalContent}
          onValidationRequired={handleValidationRequired}
        />

        <CampaignStepRenderer
          currentStep={currentStep}
          brandProfile={brandProfile}
          productList={productList}
          campaignTimeline={campaignTimeline}
          postIdeas={postIdeas}
          generatedPosts={generatedPosts}
          finalContent={finalContent}
          campaignName={campaignName}
          currentBrand={currentBrand}
          formStates={formStates}
          isLoadingData={isLoadingData}
          onStepComplete={handleStepCompleteWrapper}
          onCampaignNameChange={setCampaignName}
          onFormStateChange={handleFormStateChange}
          onPostIdeasUpdate={setPostIdeas}
          onGeneratedPostsUpdate={setGeneratedPosts}
        />
      </div>

      <ValidationDialog
        open={validationDialog.open}
        onOpenChange={(open) => setValidationDialog(prev => ({ ...prev, open }))}
        title={validationDialog.title}
        description={validationDialog.description}
        requirements={validationDialog.requirements}
      />
    </div>
  );
};

// Export types for other components to use
export type { CampaignTimeline, PostIdea, GeneratedPost, FormStates } from '@/hooks/useCampaignState';

export default Campaign;
