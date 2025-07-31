const API_BASE_URL = 'https://bdownzyb.onrender.com';

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const videoUrlInput = document.getElementById('videoUrl');
    const actionBtn = document.getElementById('actionBtn');
    const btnText = document.getElementById('btnText');
    const resultsSection = document.getElementById('resultsSection');
    const videoThumbnail = document.getElementById('videoThumbnail');
    const videoTitle = document.getElementById('videoTitle');
    const formatOptions = document.getElementById('formatOptions');
    const loadingModal = document.getElementById('loadingModal');
    const toggleSearch = document.getElementById('toggleSearch');
    const searchContainer = document.getElementById('searchContainer');
    const searchQuery = document.getElementById('searchQuery');
    const searchBtn = document.getElementById('searchBtn');
    const searchResults = document.getElementById('searchResults');
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notificationMessage');
    const themeToggleBtns = document.querySelectorAll('.toggle-btn');

    // State
    let currentVideoInfo = null;
    let debounceTimer;

    // Theme Toggle
    themeToggleBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const theme = this.getAttribute('data-theme');
            document.documentElement.setAttribute('data-theme', theme);
            
            themeToggleBtns.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Save preference
            localStorage.setItem('theme', theme);
        });
    });

    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.querySelector(`.toggle-btn[data-theme="${savedTheme}"]`).classList.add('active');

    // Event Listeners
    actionBtn.addEventListener('click', processVideo);
    videoUrlInput.addEventListener('input', handleUrlInput);
    searchBtn.addEventListener('click', searchYouTube);
    searchQuery.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') searchYouTube();
    });
    toggleSearch.addEventListener('click', toggleSearchContainer);

    // Auto-process when valid URL is detected
    function handleUrlInput() {
        const url = videoUrlInput.value.trim();
        
        // Clear previous debounce
        clearTimeout(debounceTimer);
        
        // Validate URL format
        if (isValidUrl(url)) {
            btnText.textContent = "Processando...";
            actionBtn.classList.add('processing');
            
            // Debounce to avoid rapid firing
            debounceTimer = setTimeout(() => {
                processVideo();
            }, 800);
        } else {
            btnText.textContent = "Ir";
            actionBtn.classList.remove('processing');
        }
    }

    function isValidUrl(url) {
        const patterns = [
            /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/,
            /^(https?:\/\/)?(www\.)?(facebook\.com|fb\.watch)\/.+/,
            /^(https?:\/\/)?(www\.)?(tiktok\.com)\/.+/,
            /^(https?:\/\/)?(www\.)?(instagram\.com)\/.+/
        ];
        
        return patterns.some(pattern => pattern.test(url));
    }

    async function processVideo() {
        const url = videoUrlInput.value.trim();
        
        if (!isValidUrl(url)) {
            showNotification('Por favor, insira um URL válido', 'error');
            btnText.textContent = "Ir";
            actionBtn.classList.remove('processing');
            return;
        }

        try {
            loadingModal.classList.remove('hidden');
            btnText.textContent = "Processando";
            
            const response = await fetch(`${API_BASE_URL}/api/convert`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });
            
            if (!response.ok) throw new Error('Não foi possível processar o vídeo');
            
            const data = await response.json();
            currentVideoInfo = data;
            
            displayResults(data);
            showNotification('Vídeo processado com sucesso!', 'success');
        } catch (error) {
            console.error('Error:', error);
            showNotification(error.message || 'Erro ao processar o vídeo', 'error');
        } finally {
            loadingModal.classList.add('hidden');
            btnText.textContent = "Concluído";
            setTimeout(() => {
                if (isValidUrl(videoUrlInput.value.trim())) {
                    btnText.textContent = "Novo";
                } else {
                    btnText.textContent = "Ir";
                }
                actionBtn.classList.remove('processing');
            }, 1000);
        }
    }

    function displayResults(data) {
        if (!data || !data.formats || data.formats.length === 0) {
            showNotification('Nenhum formato disponível encontrado', 'error');
            return;
        }
        
        videoThumbnail.src = data.thumbnail;
        videoTitle.textContent = data.title;
        
        formatOptions.innerHTML = '';
        
        // Sort formats by quality (highest first)
        const sortedFormats = [...data.formats].sort((a, b) => {
            const aQuality = parseInt(a.quality) || 0;
            const bQuality = parseInt(b.quality) || 0;
            return bQuality - aQuality;
        });
        
        // Create download buttons
        sortedFormats.forEach(format => {
            const btn = document.createElement('button');
            btn.className = 'download-btn';
            
            if (format.type === 'video') {
                btn.classList.add('bg-gradient-to-r', 'from-blue-600', 'to-blue-400');
            } else {
                btn.classList.add('bg-gradient-to-r', 'from-green-600', 'to-green-400');
            }
            
            btn.innerHTML = `
                <span>${format.quality} (${format.type.toUpperCase()})</span>
                <i class="fas fa-download ml-2"></i>
            `;
            
            btn.addEventListener('click', () => handleDownload(format));
            formatOptions.appendChild(btn);
        });
        
        // Show results with animation
        resultsSection.classList.remove('hidden');
        setTimeout(() => {
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }

    async function handleDownload(format) {
        if (!currentVideoInfo) return;
        
        try {
            loadingModal.classList.remove('hidden');
            showNotification('Preparando download...', 'info');
            
            // Redirect to ad first
            await redirectToAd();
            
            // Start download (CORREÇÃO AQUI - adicionado /api/)
            const downloadUrl = `${API_BASE_URL}/api/download?id=${currentVideoInfo.id}&format=${format.itag}`;
            window.open(downloadUrl, '_blank');
            
            showNotification('Download iniciado!', 'success');
        } catch (error) {
            console.error('Download error:', error);
            showNotification('Erro ao iniciar download', 'error');
        } finally {
            loadingModal.classList.add('hidden');
        }
    }

    function redirectToAd() {
        return new Promise((resolve) => {
            // Show ad for 2 seconds before resolving
            setTimeout(resolve, 2000);
        });
    }

    // YouTube Search Functions
    function toggleSearchContainer() {
        searchContainer.classList.toggle('hidden');
        if (!searchContainer.classList.contains('hidden')) {
            videoUrlInput.placeholder = "Ou cole o link do vídeo aqui...";
            searchQuery.focus();
        } else {
            videoUrlInput.placeholder = "Cole o link do vídeo aqui...";
        }
    }

    async function searchYouTube() {
        const query = searchQuery.value.trim();
        if (!query) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            
            displaySearchResults(data.items || []);
        } catch (error) {
            console.error('Search error:', error);
            showNotification('Erro ao pesquisar vídeos', 'error');
        }
    }

    function displaySearchResults(items) {
        searchResults.innerHTML = '';
        
        if (!items || items.length === 0) {
            searchResults.innerHTML = '<p class="p-4 opacity-70">Nenhum resultado encontrado</p>';
            searchResults.classList.remove('hidden');
            return;
        }
        
        items.slice(0, 5).forEach(item => {
            const resultItem = document.createElement('div');
            resultItem.className = 'search-item p-3 flex items-center';
            
            resultItem.innerHTML = `
                <img src="${item.snippet.thumbnails.default.url}" 
                     alt="${item.snippet.title}" 
                     class="w-12 h-9 object-cover rounded mr-3">
                <div class="flex-1">
                    <h4 class="font-medium text-sm line-clamp-1">${item.snippet.title}</h4>
                    <p class="text-xs opacity-70">${item.snippet.channelTitle}</p>
                </div>
                <i class="fas fa-chevron-right opacity-50"></i>
            `;
            
            resultItem.addEventListener('click', () => {
                videoUrlInput.value = `https://youtube.com/watch?v=${item.id.videoId}`;
                searchResults.classList.add('hidden');
                searchQuery.value = '';
                processVideo();
            });
            
            searchResults.appendChild(resultItem);
        });
        
        searchResults.classList.remove('hidden');
    }

    // Close search results when clicking outside
    document.addEventListener('click', function(e) {
        if (!searchContainer.contains(e.target) && e.target !== toggleSearch) {
            searchResults.classList.add('hidden');
        }
    });

    // Notification system
    function showNotification(message, type = 'success') {
        notification.className = `notification ${type === 'error' ? 'bg-red-600' : 
                                type === 'info' ? 'bg-blue-600' : 'bg-green-600'} 
                                px-6 py-3 rounded-lg shadow-lg`;
        notificationMessage.textContent = message;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
});