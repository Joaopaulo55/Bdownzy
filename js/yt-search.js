document.addEventListener('DOMContentLoaded', function() {
    const searchQuery = document.getElementById('searchQuery');
    const searchBtn = document.getElementById('searchBtn');
    const searchResults = document.getElementById('searchResults');
    const videoUrlInput = document.getElementById('videoUrl');
    
    const API_BASE_URL = 'https://bdownzyb.onrender.com/api'; // Adicionado
    
    searchBtn.addEventListener('click', searchYouTube);
    searchQuery.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') searchYouTube();
    });

    async function searchYouTube() {
        const query = searchQuery.value.trim();
        if (!query) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`); // Modificado
            const data = await response.json();
            
            displayResults(data.items);
        } catch (error) {
            console.error('Search error:', error);
        }
    }

    function displayResults(items) {
        searchResults.innerHTML = '';
        
        if (!items || items.length === 0) {
            searchResults.innerHTML = '<p class="text-gray-400 p-4">Nenhum resultado encontrado</p>';
            searchResults.classList.remove('hidden');
            return;
        }
        
        items.slice(0, 5).forEach(item => {
            const resultItem = document.createElement('div');
            resultItem.className = 'p-3 hover:bg-gray-700 cursor-pointer transition flex items-center';
            
            resultItem.innerHTML = `
                <img src="${item.snippet.thumbnails.default.url}" alt="${item.snippet.title}" 
                    class="w-16 h-12 object-cover rounded mr-3">
                <div class="flex-1">
                    <h4 class="font-medium text-sm line-clamp-1">${item.snippet.title}</h4>
                    <p class="text-xs text-gray-400">${item.snippet.channelTitle}</p>
                </div>
            `;
            
            resultItem.addEventListener('click', () => {
                videoUrlInput.value = `https://youtube.com/watch?v=${item.id.videoId}`;
                searchResults.classList.add('hidden');
                searchQuery.value = '';
            });
            
            searchResults.appendChild(resultItem);
        });
        
        searchResults.classList.remove('hidden');
    }
    
    // Close results when clicking outside
    document.addEventListener('click', function(e) {
        if (!searchContainer.contains(e.target) && e.target !== toggleSearch) {
            searchResults.classList.add('hidden');
        }
    });
});