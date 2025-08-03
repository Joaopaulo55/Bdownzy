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
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notificationMessage');
    const themeToggleBtns = document.querySelectorAll('.toggle-btn');

    // State
    let currentVideoInfo = null;

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
    videoUrlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') processVideo();
    });

    async function processVideo() {
        const url = videoUrlInput.value.trim();
        
        if (!url) {
            showNotification('Por favor, insira um URL válido', 'error');
            return;
        }

        try {
            loadingModal.classList.add('show');
            btnText.textContent = "Processando";
            
            const response = await fetch(`${API_BASE_URL}/api/convert`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Não foi possível processar o vídeo');
            }
            
            const data = await response.json();
            currentVideoInfo = data;
            
            displayResults(data);
            showNotification('Vídeo processado com sucesso!', 'success');
        } catch (error) {
            console.error('Error:', error);
            showNotification(error.message || 'Erro ao processar o vídeo', 'error');
        } finally {
            loadingModal.classList.remove('show');
            btnText.textContent = "Concluído";
            setTimeout(() => {
                btnText.textContent = "Ir";
            }, 2000);
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
               <span>${format.quality} - ${format.label}${format.size ? ` - ${format.size}` : ''}</span>
 <i class="fas fa-download ml-2"></i>
            `;
            
            btn.addEventListener('click', () => handleDownload(format));
            formatOptions.appendChild(btn);
        });
        
        // Show results with animation
        resultsSection.classList.add('show');
        setTimeout(() => {
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }

    async function handleDownload(format) {
        if (!currentVideoInfo) return;
        
        try {
            loadingModal.classList.add('show');
            showNotification('Preparando download...', 'info');
            
            // Redirect to ad first
            await redirectToAd();
            
            // Start download
            const downloadUrl = format.url;
window.open(downloadUrl, '_blank');

            showNotification('Download iniciado!', 'success');
        } catch (error) {
            console.error('Download error:', error);
            showNotification('Erro ao iniciar download', 'error');
        } finally {
            loadingModal.classList.remove('show');
        }
    }

    function redirectToAd() {
        return new Promise((resolve) => {
            // Show ad for 2 seconds before resolving
            setTimeout(resolve, 2000);
        });
    }

    // Notification system
    function showNotification(message, type = 'success') {
        notification.className = `notification ${type === 'error' ? 'error' : 
                                type === 'info' ? 'bg-blue-600' : 'success'} 
                                px-6 py-3 rounded-lg shadow-lg`;
        notificationMessage.textContent = message;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
});