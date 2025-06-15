// src/app/pages/about/about.page.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-about',
  templateUrl: './about.page.html',
  styleUrls: ['./about.page.scss'],
})
export class AboutPage implements OnInit {

  developers = [
    {
      name: 'Rafael Moncayo Pérez',
      role: 'Desarrollador Full Stack',
      bio: 'Apasionado desarrollador especializado en tecnologías web modernas y aplicaciones móviles.',
      avatar: 'https://github.com/Rafamp34.png',
      github: 'https://github.com/Rafamp34',
      skills: ['Angular', 'Ionic', 'TypeScript', 'Kotlin', 'Java', 'Python'],
    }
  ];

  features = [
    {
      icon: 'musical-notes-outline',
      title: 'Streaming de Música',
      description: 'Reproduce música de alta calidad con controles avanzados de reproducción.'
    },
    {
      icon: 'list-outline',
      title: 'Gestión de Playlists',
      description: 'Crea, edita y organiza tus listas de reproducción personalizadas.'
    },
    {
      icon: 'person-outline',
      title: 'Perfiles de Usuario',
      description: 'Personaliza tu perfil y gestiona tus preferencias musicales.'
    },
    {
      icon: 'search-outline',
      title: 'Búsqueda Avanzada',
      description: 'Encuentra fácilmente canciones, artistas y álbumes con búsqueda inteligente.'
    },
    {
      icon: 'language-outline',
      title: 'Soporte Multiidioma',
      description: 'Aplicación disponible en múltiples idiomas para una experiencia global.'
    },
    {
      icon: 'phone-portrait-outline',
      title: 'Diseño Responsivo',
      description: 'Interfaz optimizada para dispositivos móviles, tablets y escritorio.'
    }
  ];

  technologies = [
    { name: 'Angular', icon: 'logo-angular', color: '#dd0031' },
    { name: 'Ionic', icon: 'logo-ionic', color: '#3880ff' },
    { name: 'TypeScript', icon: 'logo-javascript', color: '#007acc' },
    { name: 'Strapi', icon: 'server-outline', color: '#4945ff' },
    { name: 'Tailwind CSS', icon: 'color-palette-outline', color: '#06b6d4' },
    { name: 'Capacitor', icon: 'hardware-chip-outline', color: '#119eff' },
    { name: 'Node.js', icon: 'logo-nodejs', color: '#339933' },
    { name: 'Cloudinary', icon: 'logo-firebase', color: '#ffca28' },
  ];

  constructor(private router: Router) { }

  // eslint-disable-next-line @angular-eslint/no-empty-lifecycle-method
  ngOnInit() {
  }

  /**
   * ✅ NUEVA: Navega al Home
   */
  goToHome() {
    this.router.navigate(['/home']);
  }

  /**
   * Abre el repositorio principal del proyecto en GitHub
   */
  async openRepository() {
    const url = 'https://github.com/Rafamp34/Proyecto-UMusicWeb';
    window.open(url, '_blank');
  }

  /**
   * Abre el perfil de GitHub de un desarrollador
   */
  async openGithubProfile(githubUrl: string) {
    window.open(githubUrl, '_blank');
  }

  /**
   * Abre el cliente de email para contacto
   */
  async openEmail() {
    const email = 'rafaelmoncayop37@gmail.com';
    const subject = 'Contacto desde UMusic App';
    const body = 'Hola, me gustaría contactar con el equipo de UMusic...';
    
    window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  /**
   * Comparte la aplicación
   */
  async shareApp() {
    const shareData = {
      title: 'UMusic - Music Streaming App',
      text: 'Descubre UMusic, la mejor app de streaming de música',
      url: 'https://github.com/Rafamp34/Proyecto-UMusicWeb',
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        console.log('URL copiada al portapapeles');
      }
    } catch (error) {
      console.log('Error sharing', error);
    }
  }
}