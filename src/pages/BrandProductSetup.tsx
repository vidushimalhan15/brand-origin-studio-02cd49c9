import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BrandSetup } from '@/components/campaign/BrandSetup';
import { ProductSetup } from '@/components/campaign/ProductSetup';
import { ProductSetupWithDrafts } from '@/components/campaign/ProductSetupWithDrafts';
import { BrandLibrary } from '@/components/campaign/BrandLibrary';
import { CreateBrandModal } from '@/components/campaign/CreateBrandModal';
import { BrandSetupWithDrafts } from '@/components/campaign/BrandSetupWithDrafts';
import { NextStepButton } from '@/components/ui/next-step-button';

import AppSidebar from '@/components/AppSidebar';
import { ArrowLeft, ArrowRight, FileText, Building, Lock, Save } from 'lucide-react';
import {
  loadBrandData,
  saveBrandData,
  deleteBrandData,
  migrateLegacyData,
  calculateBrandProgress,
  loadBrandsFromSupabase,
  loadBrandDataFromSupabase
} from '@/utils/brandDataManager';
import { preloadBrandData, clearBrandCache } from '@/hooks/useProgressiveHydration';
import { getBrandImage } from '@/utils/brandAvatar';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { ValidationDialog } from '@/components/ValidationDialog';
import { validateBrandSetup, validateProductSetup } from '@/utils/stepValidation';
import { useGlobalNavigation } from '@/hooks/useGlobalNavigation';

export interface BrandProfile {
  name: string;
  introduction: string;
  tone: string[];
  voice: string[];
  industryNiches: string[];
  brandDeck?: File;
  keyMessages?: string[];
  extractedInfo?: {
    values: string[];
    colors: string[];
    keyMessages: string[];
    targetAudience: string;
    brandPersonality?: string;
    communicationStyle?: string;
    summary?: string;
    brandType?: 'personal' | 'company' | '';
    personalDetails?: {
      roles?: string[];
      yearsExperience?: string | number;
      expertise?: string[];
      education?: string[];
      certifications?: string[];
      achievements?: string[];
    } | null;
    companyDetails?: {
      foundedYear?: string | number;
      size?: string;
      headquarters?: string;
      markets?: string[];
      products?: string[];
      services?: string[];
    } | null;
    industryNiches?: string[];
    tagline?: string;
  };
  slogan?: string;
  audiences?: any[];
  type?: string;
  website_url?: string;
}

export interface ProductDetails {
  id?: string;
  name: string;
  description: string;
  url?: string;
  price?: string;
  currency?: string;
  image?: string;
}

interface Brand {
  id: string;
  name: string;
  type: 'personal' | 'business';
  hasSetup: boolean;
  hasCampaign: boolean;
  hasContent: boolean;
  logoUrl?: string;
  customImage?: string;
}

const BrandProductSetup = () => {
  const navigate = useNavigate();

  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(() => {
    const saved = localStorage.getItem('brandProfile');
    return saved ? JSON.parse(saved) : null;
  });
  const [productList, setProductList] = useState<ProductDetails[]>(() => {
    const saved = localStorage.getItem('productList');
    const parsed = saved ? JSON.parse(saved) : [];
    return parsed;
  });
  const [audiences, setAudiences] = useState<any[]>([]);
  const [validationDialog, setValidationDialog] = useState({
    open: false,
    title: '',
    description: '',
    requirements: [] as Array<{
      text: string;
      completed: boolean;
    }>
  });

  // Global navigation
  const globalNav = useGlobalNavigation({
    brandProfile,
    productList: { products: productList }
  });

  const handleGlobalNext = useCallback(() => {
    // Save brand data before validation and navigation
    window.dispatchEvent(new CustomEvent('saveBrandData'));

    // Small delay to allow save to complete before validation
    setTimeout(() => {
      globalNav.handleNextStep((validation) => {
        setValidationDialog({
          open: true,
          title: validation.title,
          description: validation.description,
          requirements: validation.requirements
        });
      });

      // Navigate to campaign if validation passes
      if (globalNav.nextStep?.route === '/campaign') {
        navigate('/content-strategy-writing-style');
      }
    }, 50);
  }, [globalNav, navigate]);
  const [brands, setBrands] = useState<Brand[]>(() => {
    const saved = localStorage.getItem('brands');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentBrand, setCurrentBrand] = useState<Brand | null>(() => {
    const saved = localStorage.getItem('currentBrand');
    if (saved) {
      return JSON.parse(saved);
    }
    // Don't auto-select a brand - let user choose explicitly
    return null;
  });
  const [createBrandModalOpen, setCreateBrandModalOpen] = useState(false);
  const [isSwitchingBrands, setIsSwitchingBrands] = useState(false);
  const [transactionLocked, setTransactionLocked] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingBrandData, setIsLoadingBrandData] = useState(false);

  // Load brands from Supabase on component mount
  useEffect(() => {
    const loadBrands = async () => {
      setIsInitialLoading(true);

      try {
        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise<any[]>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout loading brands')), 10000)
        );

        const supabaseBrands = await Promise.race([
          loadBrandsFromSupabase(),
          timeoutPromise
        ]);

        if (supabaseBrands.length > 0) {

          // Transform Supabase brands to match our Brand interface
          const transformedBrands = supabaseBrands.map(b => ({
            id: b.id,
            name: b.name,
            type: b.type as 'personal' | 'business',
            hasSetup: b.has_setup || false,
            hasCampaign: b.has_campaign || false,
            hasContent: b.has_content || false,
            logoUrl: b.logo_url,
            customImage: b.custom_image
          }));

          // Merge with localStorage brands (prefer Supabase data)
          const localBrands = JSON.parse(localStorage.getItem('brands') || '[]');
          const mergedBrands = transformedBrands.map(sb => {
            const localBrand = localBrands.find((lb: any) => lb.id === sb.id);
            return { ...localBrand, ...sb }; // Supabase data overrides local
          });

          setBrands(mergedBrands);
          localStorage.setItem('brands', JSON.stringify(mergedBrands));

          // Always select a brand on initial load — even if currentBrand was null from localStorage
          if (mergedBrands.length > 0) {
            // Try to restore last selected, otherwise pick first
            const lastSelectedId = localStorage.getItem('currentBrand');
            let parsed: Brand | null = null;
            try { parsed = lastSelectedId ? JSON.parse(lastSelectedId) : null; } catch { /* ignore */ }
            const matchedBrand = parsed ? mergedBrands.find((b: Brand) => b.id === parsed!.id) : null;
            const brandToSelect = matchedBrand || mergedBrands[0];
            setCurrentBrand(brandToSelect);
            localStorage.setItem('currentBrand', JSON.stringify(brandToSelect));
          }
        } else {
          // Fallback to localStorage if Supabase returns empty
          const localBrands = JSON.parse(localStorage.getItem('brands') || '[]');
          if (localBrands.length > 0) {
            setBrands(localBrands);
            if (!currentBrand) {
              setCurrentBrand(localBrands[0]);
            }
          }
        }
      } catch (error) {
        // Fallback to localStorage on error
        const localBrands = JSON.parse(localStorage.getItem('brands') || '[]');
        if (localBrands.length > 0) {
          setBrands(localBrands);
          if (!currentBrand) {
            setCurrentBrand(localBrands[0]);
          }
        }
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadBrands();
  }, []); // Run once on mount

  // Load brand-specific data when current brand changes with preloading optimization
  useEffect(() => {

    // Skip loading during transactions to prevent race conditions
    if (transactionLocked) {
      return;
    }

    if (currentBrand) {
      const loadData = async () => {
        setIsLoadingBrandData(true);

        // Clear cache for previous brand to free memory
        const savedBrand = localStorage.getItem('previousBrandId');
        if (savedBrand && savedBrand !== currentBrand.id) {
          clearBrandCache(savedBrand);
        }

        // Preload current brand data for faster access
        preloadBrandData(currentBrand.id);
        localStorage.setItem('previousBrandId', currentBrand.id);

        // Migrate legacy data if needed
        migrateLegacyData(currentBrand.id);

        // Load brand-specific data from localStorage first
        let brandData = loadBrandData(currentBrand.id);

        // If no data in localStorage, try to load from Supabase
        if (!brandData.brandProfile) {
          const supabaseData = await loadBrandDataFromSupabase(currentBrand.id);

          if (supabaseData && supabaseData.brandProfile) {
            brandData = supabaseData; // Update brandData with Supabase data
            setBrandProfile(supabaseData.brandProfile);
            setProductList(supabaseData.productList || []);
            setAudiences(supabaseData.audiences || []);
            // Save to localStorage for future fast access
            saveBrandData(currentBrand.id, supabaseData);
          }
        }

        // Check if this is a new brand with no data (after checking Supabase)
        if (!brandData.brandProfile) {
          // Initialize with clean data for new brands
          const cleanBrandProfile: BrandProfile = {
            name: currentBrand.name,
            introduction: '',
            tone: [],
            voice: [],
            industryNiches: [],
            keyMessages: [],
            extractedInfo: undefined
          };
          setBrandProfile(cleanBrandProfile);
          setProductList([]);
        } else if (brandData.brandProfile) {
          // Handle productList structure (array vs object with products property)
          let productArray: any[] = [];
          if (Array.isArray(brandData.productList)) {
            productArray = brandData.productList;
          } else if (brandData.productList && Array.isArray((brandData.productList as any).products)) {
            productArray = (brandData.productList as any).products;
          }


          // Set the loaded data
          setBrandProfile(brandData.brandProfile);
          setProductList(productArray);
          setAudiences(brandData.audiences || []);
        }

        // Brand data is now loaded, enable auto-save
        setIsSwitchingBrands(false);
        setIsLoadingBrandData(false);
      };

      loadData();
    } else {
      setBrandProfile(null);
      setProductList([]);
      setIsSwitchingBrands(false);
      setIsLoadingBrandData(false);
    }
  }, [currentBrand?.id, transactionLocked]); // Include transactionLocked to skip during transactions

  // Sync images from localStorage to brand state on component mount and when brands change
  useEffect(() => {
    syncBrandImages();
  }, []);
  useEffect(() => {
    syncBrandImages();
  }, [brands.length]); // Re-sync when brands list changes

  const syncBrandImages = () => {
    setBrands(prevBrands => prevBrands.map(brand => {
      const storedImage = getBrandImage(brand.id);
      if (storedImage && !brand.customImage) {
        return {
          ...brand,
          customImage: storedImage
        };
      }
      return brand;
    }));
  };

  // Auto-save brand data whenever it changes (debounced to prevent loops)
  useEffect(() => {

    // Skip auto-save during transactions or brand switches to prevent data contamination
    if (transactionLocked || isSwitchingBrands) {
      return;
    }

    if (currentBrand && brandProfile) {

      // Use a timeout to prevent rapid saves during initialization
      const timeoutId = setTimeout(async () => {
        // Double-check transaction lock before saving
        if (!transactionLocked && !isSwitchingBrands) {

          await saveBrandData(currentBrand.id, {
            brandProfile,
            productList,
            audiences
          });
        } else {
        }
      }, 500); // Increased timeout to ensure state is settled
      return () => clearTimeout(timeoutId);
    } else {
    }
  }, [brandProfile, productList, audiences, currentBrand?.id, isSwitchingBrands, transactionLocked]);

  // Auto-save brands list to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('brands', JSON.stringify(brands));
  }, [brands]);

  // Auto-save current brand to localStorage whenever it changes
  useEffect(() => {
    if (currentBrand) {
      localStorage.setItem('currentBrand', JSON.stringify(currentBrand));
    } else {
      localStorage.removeItem('currentBrand');
    }
  }, [currentBrand?.id, currentBrand?.name, currentBrand?.customImage]); // Only depend on specific properties

  const handleBrandComplete = (data: BrandProfile, options?: { skipNavigation?: boolean }) => {

    // Extract audience data if present
    let audiencesToSave = audiences; // Default to current audiences
    const audience = (data as any).audience;
    if (audience) {
      // Create audience object if we have audience data
      if (audience.description || audience.suggestedAudience) {
        const audienceData = {
          id: `audience_${currentBrand?.id}_${Date.now()}`,
          brand_id: currentBrand?.id,
          name: 'Primary Audience',
          description: audience.description || audience.suggestedAudience || '',
          painPoints: audience.painPoints || [],
          ageGroup: audience.ageGroup || '',
          location: audience.location || '',
          roleOrIndustry: audience.roleOrIndustry || ''
        };
        audiencesToSave = [audienceData];
        setAudiences(audiencesToSave);
      }
      // Remove audience from brandProfile before saving
      delete (data as any).audience;
    }

    setBrandProfile(data);

    // Manually trigger save immediately with the correct audiences
    if (currentBrand && data) {
      saveBrandData(currentBrand.id, {
        brandProfile: data,
        productList,
        audiences: audiencesToSave
      }).then(() => {
      }).catch((error) => {
      });
    }

    // Navigate to campaign planning if not skipping navigation
    if (!options?.skipNavigation) {
      navigate('/content-strategy-writing-style');
    }
  };
  const handleProductComplete = (data: ProductDetails) => {

    try {
      if (data.id) {
        // Update existing product
        setProductList(prev => {
          // Ensure prev is always an array
          const currentList = Array.isArray(prev) ? prev : [];
          const updated = currentList.map(product => product.id === data.id ? {
            ...data
          } : product);
          return updated;
        });
      } else {
        // Add new product with unique ID
        const newProduct = {
          ...data,
          id: `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        setProductList(prev => {
          // Ensure prev is always an array
          const currentList = Array.isArray(prev) ? prev : [];
          const updated = [...currentList, newProduct];
          return updated;
        });
      }
    } catch (error) {
    }
  };
  const handleProductDelete = (productId: string) => {
    setProductList(prev => {
      const updatedList = prev.filter(product => product.id !== productId);
      return updatedList;
    });
  };
  // Manual save function
  const handleManualSave = async () => {
    if (!currentBrand) {
      toast({
        title: "No Brand Selected",
        description: "Please select or create a brand first.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);

    try {
      // Trigger save event for BrandSetup component to save its current data
      window.dispatchEvent(new CustomEvent('saveBrandData'));

      // Save all current data
      await saveBrandData(currentBrand.id, {
        brandProfile,
        productList,
        audiences
      });


      toast({
        title: "Saved Successfully",
        description: "All your brand data has been saved.",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "There was an error saving your data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleContinueToCampaign = () => {
    // Validate brand setup
    const brandValidation = validateBrandSetup(brandProfile);
    const productValidation = validateProductSetup(productList);
    const allRequirements = [...brandValidation.requirements, ...productValidation.requirements];
    const isAllValid = brandValidation.isValid && productValidation.isValid;
    if (!isAllValid) {
      setValidationDialog({
        open: true,
        title: 'Complete Setup Required',
        description: 'Please complete all required steps before proceeding to campaign planning.',
        requirements: allRequirements
      });
      return;
    }

    // Store data in localStorage temporarily (will move to Supabase later)
    localStorage.setItem('brandProfile', JSON.stringify(brandProfile));
    localStorage.setItem('productList', JSON.stringify(productList));
    navigate('/content-strategy-writing-style');
  };
  const progressPercentage = () => {
    if (!currentBrand) return 0;
    return calculateBrandProgress(currentBrand.id);
  };

  const handleBrandSelect = async (brand: Brand) => {

    // Lock transactions to prevent auto-save contamination
    setTransactionLocked(true);

    try {
      // Save current brand data before switching
      if (currentBrand) {
        const dataToSave = {
          brandProfile,
          productList
        };
        saveBrandData(currentBrand.id, dataToSave);

        // Verify data was saved
        const savedData = loadBrandData(currentBrand.id);
      }

      // Set switching flag to prevent auto-save during brand switch
      setIsSwitchingBrands(true);

      // Clear current state immediately to prevent contamination
      setBrandProfile(null);
      setProductList([]);

      // Wait for state to clear
      await new Promise(resolve => setTimeout(resolve, 50));

      // Switch to new brand (useEffect will load the new data)
      setCurrentBrand(brand);
      setCreateBrandModalOpen(false);

    } finally {
      // Unlock transactions after a delay to ensure everything settles
      setTimeout(() => {
        setTransactionLocked(false);
      }, 200);
    }
  };
  const handleDeleteBrand = (brandIdToDelete: string) => {
    // Delete brand data
    deleteBrandData(brandIdToDelete);

    // Remove from brands list
    const updatedBrands = brands.filter(brand => brand.id !== brandIdToDelete);
    setBrands(updatedBrands);

    // If no brands left, clear current brand and show create modal
    if (updatedBrands.length === 0) {
      setCurrentBrand(null);
      setBrandProfile(null);
      setProductList([]);
      setCreateBrandModalOpen(true);
    } else if (currentBrand?.id === brandIdToDelete) {
      // If deleting current brand but others exist, switch to first available brand
      const newCurrentBrand = updatedBrands[0];
      setCurrentBrand(newCurrentBrand);
    }
    toast({
      title: "Brand deleted",
      description: "Brand and all associated data have been removed."
    });
  };
  const handleCreateNewBrand = () => {
    setCreateBrandModalOpen(true);
  };
  const handleBrandUpdate = (updatedBrand: Brand) => {
    setBrands(prev => prev.map(brand => brand.id === updatedBrand.id ? updatedBrand : brand));

    // If this is the current brand, update it too
    if (currentBrand?.id === updatedBrand.id) {
      setCurrentBrand(updatedBrand);
    }

    // Force re-render to show updated image
    setTimeout(() => {
      syncBrandImages();
    }, 100);
  };
  const handleBrandCreated = async (name: string, type: 'personal' | 'business') => {

    // Lock transactions to prevent auto-save contamination
    setTransactionLocked(true);

    try {
      // Save current brand data before creating new one
      if (currentBrand && brandProfile) {
        saveBrandData(currentBrand.id, {
          brandProfile,
          productList
        });
      }

      // Clear component state to prevent contamination
      setBrandProfile(null);
      setProductList([]);

      const newBrand: Brand = {
        id: `brand_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        type,
        hasSetup: false,
        hasCampaign: false,
        hasContent: false
      };

      // Initialize CLEAN brand data with ONLY the brand name
      const initialBrandProfile: BrandProfile = {
        name, // Only set the name, everything else should be empty
        introduction: '',
        tone: [],
        voice: [],
        industryNiches: [],
        keyMessages: [],
        extractedInfo: undefined // Explicitly set to undefined to prevent old data
      };

      // Save the CLEAN initial data FIRST before updating state
      saveBrandData(newBrand.id, {
        brandProfile: initialBrandProfile,
        productList: [],
        campaignData: null,
        drafts: [],
        postIdeas: [],
        generatedPosts: [],
        finalContent: []
      });

      // Wait for state to settle
      await new Promise(resolve => setTimeout(resolve, 50));

      // Now update the component state with clean data
      setBrands(prev => [...prev, newBrand]);
      setCurrentBrand(newBrand);
      setBrandProfile(initialBrandProfile);
      setProductList([]);

      setCreateBrandModalOpen(false);
      toast({
        title: "Brand created",
        description: `${name} has been created successfully.`
      });

    } finally {
      // Always unlock transactions after a delay to ensure everything settles
      setTimeout(() => {
        setTransactionLocked(false);
      }, 200);
    }
  };

  // Check if we can show the continue button
  const brandValidation = validateBrandSetup(brandProfile);
  const productValidation = validateProductSetup(productList);
  const canContinue = brandValidation.isValid && productValidation.isValid;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex">
      {/* Sidebar */}
      <AppSidebar
        currentStep={-1} // Special value for brand setup
        steps={[]}
        onStepChange={() => { }} // No step changes in brand setup
        onValidationRequired={(title, description, requirements) => {
          setValidationDialog({
            open: true,
            title,
            description,
            requirements
          });
        }}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {isInitialLoading || isLoadingBrandData ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-500 text-sm">Loading your brands...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Refined Header */}
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                {/* Left: Navigation Buttons */}
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled
                    className="text-gray-400 cursor-not-allowed"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleContinueToCampaign}
                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                  >
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>

                {/* Right: Step Indicator and Title */}
                <div className="text-right">
                  <p className="text-sm text-gray-500">Step 1 of 2</p>
                  <h1 className="text-base font-medium text-gray-900">Brand & Product Setup</h1>
                  <p className="text-xs text-gray-500 mt-1">Define your brand identity, voice, and product offerings</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <main className="flex-1 px-6 py-8">
              <div className="max-w-7xl mx-auto space-y-8">

                {/* Header Actions Row */}
                {currentBrand && (
                  <div className="flex justify-end">
                    <Button
                      onClick={handleManualSave}
                      disabled={isSaving || !brandProfile}
                      className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 border border-green-600 rounded-full hover:bg-green-700 transition-colors shadow-sm"
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save All Changes
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Brand Library */}
                <div className="mb-8">
                  <BrandLibrary
                    currentBrand={currentBrand}
                    brands={brands}
                    onBrandSelect={handleBrandSelect}
                    onCreateNewBrand={() => setCreateBrandModalOpen(true)}
                    onDeleteBrand={handleDeleteBrand}
                    onBrandUpdate={handleBrandUpdate}
                  />
                </div>

                {/* Unified Brand Setup Content */}
                <div className="space-y-10">
                  {currentBrand ? (
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-xl border-0 p-8">
                      <div className="space-y-8">
                        {/* Brand Setup Section - Key forces remount on brand change */}
                        <BrandSetupWithDrafts
                          key={`brand-setup-${currentBrand.id}`}
                          onComplete={handleBrandComplete}
                          initialData={brandProfile}
                          currentBrand={currentBrand}
                        />

                        {/* Product Setup Section - Key forces remount on brand change */}
                        <ProductSetupWithDrafts
                          key={`product-setup-${currentBrand.id}`}
                          onComplete={handleProductComplete}
                          existingProducts={productList}
                          onDeleteProduct={handleProductDelete}
                          currentBrand={currentBrand}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="max-w-md mx-auto">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Building className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">No Brand Selected</h3>
                        <p className="text-gray-500 mb-8 leading-relaxed">Create or select a brand to begin building your brand foundation and marketing strategy.</p>
                        <Button
                          onClick={handleCreateNewBrand}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
                        >
                          Create New Brand
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Refined Continue Button - Right Aligned Capsule */}
                  {currentBrand && (
                    <div className="flex justify-end pt-8 pb-12">
                      <Button
                        onClick={handleGlobalNext}
                        className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 rounded-full font-medium text-base shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-2"
                      >
                        Continue to Content Strategy
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </main>
          </>
        )}

        <ValidationDialog
          open={validationDialog.open}
          onOpenChange={open => setValidationDialog(prev => ({
            ...prev,
            open
          }))}
          title={validationDialog.title}
          description={validationDialog.description}
          requirements={validationDialog.requirements}
        />

        <CreateBrandModal
          open={createBrandModalOpen}
          onOpenChange={setCreateBrandModalOpen}
          onCreateBrand={handleBrandCreated}
        />
      </div>
    </div>
  );
};

export default BrandProductSetup;