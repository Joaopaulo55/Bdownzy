document.addEventListener('DOMContentLoaded', function() {
    const videoUrlInput = document.getElementById('videoUrl');
    const convertBtn = document.getElementById('convertBtn');
    const resultsSection = document.getElementById('resultsSection');
    const videoThumbnail = document.getElementById('videoThumbnail');
    const videoTitle = document.getElementById('videoTitle');
    const formatOptions = document.getElementById('formatOptions');
    const loadingModal = document.getElementById('loadingModal');
    const toggleSearch = document.getElementById('toggleSearch');
    const searchContainer = document.getElementById('searchContainer');
    
    const API_BASE_URL = 'https://bdownzyb.onrender.com/api'; // Adicionado
    
    let currentVideoInfo = null;

    // Toggle YouTube search
    toggleSearch.addEventListener('click', function() {
        searchContainer.classList.toggle('hidden');
        if (!searchContainer.classList.contains('hidden')) {
            videoUrlInput.placeholder = "Ou cole o link do vídeo aqui...";
        } else {
            videoUrlInput.placeholder = "Cole o link do vídeo aqui...";
        }
    });

    // Convert button handler
    convertBtn.addEventListener('click', processVideo);
    videoUrlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') processVideo();
    });

    async function processVideo() {
        const url = videoUrlInput.value.trim();
        if (!url) {
            showAlert('Por favor, insira um URL válido', 'error');
            return;
        }

        try {
            loadingModal.classList.remove('hidden');
            
            // Try with ytdl-core first
            let response = await fetch(`${API_BASE_URL}/convert`, { // Modificado
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url })
            });
            
            if (!response.ok) {
                // If ytdl-core fails, try with yt-dlp as fallback
                response = await fetch(`${API_BASE_URL}/convert-fallback`, { // Modificado
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ url })
                });
                
                if (!response.ok) {
                    throw new Error('Não foi possível processar o vídeo');
                }
            }
            
            const data = await response.json();
            currentVideoInfo = data;
            
            displayResults(data);
            loadingModal.classList.add('hidden');
        } catch (error) {
            loadingModal.classList.add('hidden');
            showAlert(error.message || 'Ocorreu um erro ao processar o vídeo', 'error');
            console.error('Error:', error);
        }
    }

    function displayResults(data) {
        videoThumbnail.src = data.thumbnail;
        videoTitle.textContent = data.title;
        
        formatOptions.innerHTML = '';
        
        // Create download buttons for each format
        data.formats.forEach(format => {
            const btn = document.createElement('button');
            btn.className = 'download-btn px-4 py-3 rounded-lg font-medium flex items-center justify-between transition';
            
            if (format.type === 'video') {
                btn.classList.add('bg-blue-600', 'hover:bg-blue-700');
            } else {
                btn.classList.add('bg-green-600', 'hover:bg-green-700');
            }
            
            btn.innerHTML = `
                <span>${format.quality} (${format.type.toUpperCase()})</span>
                <i class="fas fa-download ml-2"></i>
            `;
            
            btn.addEventListener('click', () => handleDownload(format));
            formatOptions.appendChild(btn);
        });
        
        resultsSection.classList.remove('hidden');
        window.scrollTo({
            top: resultsSection.offsetTop - 20,
            behavior: 'smooth'
        });
    }

    async function handleDownload(format) {
        try {
            loadingModal.classList.remove('hidden');
            
            // First redirect to monetization link
            await redirectToAd();
            
            // Then proceed with download
            const downloadUrl = `${API_BASE_URL}/download?id=${currentVideoInfo.id}&format=${format.itag}`; // Modificado
            window.open(downloadUrl, '_blank');
            
            loadingModal.classList.add('hidden');
        } catch (error) {
            loadingModal.classList.add('hidden');
            showAlert('Erro ao iniciar o download', 'error');
            console.error('Download error:', error);
        }
    }

    function redirectToAd() {
        return new Promise((resolve) => {
            setTimeout(resolve, 2000);
        });
    }

    function showAlert(message, type = 'success') {
        const alert = document.createElement('div');
        alert.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
            type === 'error' ? 'bg-red-600' : 'bg-green-600'
        }`;
        alert.textContent = message;
        document.body.appendChild(alert);
        
        setTimeout(() => {
            alert.classList.add('opacity-0', 'transition-opacity', 'duration-500');
            setTimeout(() => alert.remove(), 500);
        }, 3000);
    }
});