import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { NgForOf, NgIf } from '@angular/common';

interface Announcement {
  author: string;
  title: string;
  preview: string;
  body: string;
  isNew?: boolean;
}

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [MatCardModule, NgForOf, NgIf],
  templateUrl: './announcements.component.html',
  styleUrl: './announcements.component.css'
})
export class AnnouncementsComponent {
  selected!: Announcement;  // always assigned before modalOpen = true
  modalOpen = false;

  latest: Announcement = {
    author: 'Michael Barbados',
    title: 'Hi hello bla blu be ba be poom',
    preview: 'Hi hello bla blu be ba be poom romoko ci g a n 10.7.2025? tapa Hi hello bla blu be ba be poom romoko ci g a n 10.7.2025? tapa ram do toto ka be nu se pere mu de karanrama ram do toto ka be nu se pere mu de karanrama.',
    body: 'Hi hello bla blu be ba be poom  Hi hello bla blu be ba be poom romoko c Hi hello bla blu be ba be poom romoko ci g a n 10.7.2025? tapa ram do toto ka be nu se pere mu de karanr g a n 10.7.2025? tapa ram do toto ka be nu se pere mu de karanramaromoko ci Hi hello bla blu be ba be poom romoko ci g a n 10.7.2025? tapa ram do toto ka be nu se pere mu de karanrama g a n 10.7.2025? tapa ram do toto ka be nu se pere mu de karanrama. Accepted resume rerto petro USA Swalwalwatch Harlem Berlin MTV because money account Hi hello bla blu be ba be poom romoko ci g a n 10.7.2025? tapa ram do toto ka be nu se pere mu de karanrama remember.',
    isNew: true,
  };

  all: Announcement[] = [
    {
      author: 'Peter Oklahoma',
      title: 'Hello, I just cigarette alcohol party vacay yesterday today next camera. Hello, I just cigarette alcohol party vacay yesterday today next camera. Hello, I just cigarette alcohol party vacay yesterday today next camera............',
      preview: 'Hello, I just cigarette alcohol party vacay yesterday today next camera. Hello, I just cigarette alcohol party vacay yesterday today next camera. Hello, I just cigarette alcohol party vacay yesterday today next camera............',
      body: 'Hello, I just cigarette alcohol party vacay yesterday today next camera. Hello, I just cigarette alcohol party vacay yesterday today next camera. Hello, I just cigarette alcohol party vacay yesterday today next camera............',
    },
    {
      author: 'Michael Byers',
      title: 'Hello, I just cigarette alcohol party vacay yesterday today next camera....',
      preview: 'Hello, I just cigarette alcohol party vacay yesterday today next camera....',
      body: 'Hello, I just cigarette alcohol party vacay yesterday today next camera....',
    },
    {
      author: 'Merlin Monroe',
      title: 'Hello, I just cigarette alcohol party vacay yesterday today next camera....',
      preview: 'Hello, I just cigarette alcohol party vacay yesterday today next camera....',
      body: 'Hello, I just cigarette alcohol party vacay yesterday today next camera....',
    },
    {
      author: 'Peter Urban',
      title: 'Hello, I just cigarette alcohol party vacay yesterday today next camera....',
      preview: 'Hello, I just cigarette alcohol party vacay yesterday today next camera....',
      body: 'Hello, I just cigarette alcohol party vacay yesterday today next camera....',
    },
    {
      author: 'Donald The Duck',
      title: 'Hello, I just cigarette alcohol party vacay yesterday today next camera....',
      preview: 'Hello, I just cigarette alcohol party vacay yesterday today next camera....',
      body: 'Hello, I just cigarette alcohol party vacay yesterday today next camera....',
    },
    {
      author: 'Jacob South',
      title: 'Hello, I just cigarette alcohol party vacay yesterday today next camera....',
      preview: 'Hello, I just cigarette alcohol party vacay yesterday today next camera....',
      body: 'Hello, I just cigarette alcohol party vacay yesterday today next camera....',
    },
    {
      author: 'Hoodeenee',
      title: 'Hello, I just cigarette alcohol party vacay yesterday today next camera....',
      preview: 'Hello, I just cigarette alcohol party vacay yesterday today next camera....',
      body: 'Hello, I just cigarette alcohol party vacay yesterday today next camera....',
    },
    {
      author: 'Sarah North',
      title: 'Hello, I just cigarette alcohol party vacay yesterday today next camera....',
      preview: 'Hello, I just cigarette alcohol party vacay yesterday today next camera....',
      body: 'Hello, I just cigarette alcohol party vacay yesterday today next camera....',
    },
    {
      author: 'Leon Forest',
      title: 'Hello, I just cigarette alcohol party vacay yesterday today next camera....',
      preview: 'Hello, I just cigarette alcohol party vacay yesterday today next camera....',
      body: 'Hello, I just cigarette alcohol party vacay yesterday today next camera....',
    },
    {
      author: 'Elena Cloud',
      title: 'Hello, I just cigarette alcohol party vacay yesterday today next camera....',
      preview: 'Hello, I just cigarette alcohol party vacay yesterday today next camera....',
      body: 'Hello, I just cigarette alcohol party vacay yesterday today next camera....',
    },
    {
      author: 'Martin River',
      title: 'Hello, I just cigarette alcohol party vacay yesterday today next camera....',
      preview: 'Hello, I just cigarette alcohol party vacay yesterday today next camera....',
      body: 'Hello, I just cigarette alcohol party vacay yesterday today next camera....',
    },
    {
      author: 'Jessica Hill',
      title: 'Hello, I just cigarette alcohol party vacay yesterday today next camera....',
      preview: 'Hello, I just cigarette alcohol party vacay yesterday today next camera....',
      body: 'Hello, I just cigarette alcohol party vacay yesterday today next camera....',
    },
  ];

  select(announcement: Announcement): void {
    this.selected = announcement;
    this.modalOpen = true;
  }

  close(): void {
    this.modalOpen = false;
  }
}
