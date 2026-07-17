import { useState, useEffect } from 'react';

export interface PredefinedOption {
  name: string;
  value: string;
  order_index: number;
}

export function usePredefinedOptions(category?: string) {
  const [options, setOptions] = useState<PredefinedOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOptions() {
      try {
        setLoading(true);
        const response = await fetch('/predefined-options.json');
        const data = await response.json();
        
        if (response.ok) {
          if (category && data[category]) {
            setOptions(data[category]);
          } else if (!category) {
            // Return all options if no category specified
            const allOptions: PredefinedOption[] = [];
            Object.keys(data).forEach(cat => {
              allOptions.push(...data[cat]);
            });
            setOptions(allOptions);
          } else {
            setOptions([]);
          }
        } else {
          setError('Failed to fetch options');
        }
      } catch (err) {
        console.error('Error fetching predefined options:', err);
        setError('Failed to fetch options');
      } finally {
        setLoading(false);
      }
    }

    fetchOptions();
  }, [category]);

  return { options, loading, error };
}
