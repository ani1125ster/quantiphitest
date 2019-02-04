import { Component, OnInit, OnDestroy, AfterViewInit,ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { first } from 'rxjs/operators';
import * as RecordRTC from 'recordrtc';
import { User } from '@/_models';
import { UserService, AuthenticationService } from '@/_services';

@Component({ templateUrl: 'home.component.html' })
export class HomeComponent implements OnInit, OnDestroy {

    private stream: MediaStream;
    private recordRTC: any;

    @ViewChild('video') video: any;

    currentUser: User;
    currentUserSubscription: Subscription;
    users: User[] = [];

    constructor(
        private authenticationService: AuthenticationService,
        private userService: UserService,
        private sanitizer: DomSanitizer
    ) {
        this.currentUserSubscription = this.authenticationService.currentUser.subscribe(user => {
            this.currentUser = user;
        });
    }

    ngOnInit() {
        this.loadAllUsers();
    }

    ngOnDestroy() {
        // unsubscribe to ensure no memory leaks
        this.currentUserSubscription.unsubscribe();
    }

    deleteUser(id: number) {
        this.userService.delete(id).pipe(first()).subscribe(() => {
            this.loadAllUsers()
        });
    }

    private loadAllUsers() {
        this.userService.getAll().pipe(first()).subscribe(users => {
            this.users = users;
        });
    }

    ngAfterViewInit() {
        // set the initial state of the video
        let video: HTMLVideoElement = this.video.nativeElement;
        video.muted = false;
        video.controls = true;
        video.autoplay = false;
      }
    
      toggleControls() {
        let video: HTMLVideoElement = this.video.nativeElement;
        video.muted = !video.muted;
        video.controls = !video.controls;
        video.autoplay = !video.autoplay;
      }
    
      successCallback(stream: MediaStream) {
    
        var options = {
          mimeType: 'video/webm', // or video/webm\;codecs=h264 or video/webm\;codecs=vp9
          audioBitsPerSecond: 128000,
          videoBitsPerSecond: 128000,
          bitsPerSecond: 128000 // if this line is provided, skip above two
        };
        this.stream = stream;
        this.recordRTC = RecordRTC(stream, options);
        this.recordRTC.startRecording();
        let video: HTMLVideoElement = this.video.nativeElement;
        video.srcObject = stream;
        video.play();
        this.toggleControls();
      }
    
      errorCallback() {
        //handle error here
      }
    
      processVideo(audioVideoWebMURL) {
        let video: HTMLVideoElement = this.video.nativeElement;
        let recordRTC = this.recordRTC;
        //video.srcObject = audioVideoWebMURL;
        const mediaSource = new MediaSource();
        const video = document.createElement('video');
        try {
          video.srcObject = mediaSource;
        } catch (error) {
          video.src = URL.createObjectURL(mediaSource);
        }
            this.toggleControls();
            var recordedBlob = recordRTC.getBlob();
            recordRTC.getDataURL(function (dataURL) { });
          }
    
      startRecording() {
        let mediaConstraints = { video: true, audio: true };
        navigator.mediaDevices
          .getUserMedia(mediaConstraints)
          .then(this.successCallback.bind(this), this.errorCallback.bind(this));
    }
    
      stopRecording() {
        let recordRTC = this.recordRTC;
        recordRTC.stopRecording(this.processVideo.bind(this));
        let stream = this.stream;
        stream.getAudioTracks().forEach(track => track.stop());
        stream.getVideoTracks().forEach(track => track.stop());
      }
    
      download() {
        this.recordRTC.save('video.webm');
      }
}