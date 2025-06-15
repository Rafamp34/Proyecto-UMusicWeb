'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">repositorios documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                        <li class="link">
                            <a href="overview.html" data-type="chapter-link">
                                <span class="icon ion-ios-keypad"></span>Overview
                            </a>
                        </li>
                        <li class="link">
                            <a href="index.html" data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>README
                            </a>
                        </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>
                    </ul>
                </li>
                    <li class="chapter modules">
                        <a data-type="chapter-link" href="modules.html">
                            <div class="menu-toggler linked" data-bs-toggle="collapse" ${ isNormalMode ?
                                'data-bs-target="#modules-links"' : 'data-bs-target="#xs-modules-links"' }>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">Modules</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                        </a>
                        <ul class="links collapse " ${ isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"' }>
                            <li class="link">
                                <a href="modules/AboutPageModule.html" data-type="entity-link" >AboutPageModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-AboutPageModule-55795f560f10f133ab1cc74cb3a55939f3ed0bc1c22d6effd504f3acdfa57628dd1c39612c432b68b0a45337c2e0daf76e787219fcd2d93fb5055eaa8cba36a5"' : 'data-bs-target="#xs-components-links-module-AboutPageModule-55795f560f10f133ab1cc74cb3a55939f3ed0bc1c22d6effd504f3acdfa57628dd1c39612c432b68b0a45337c2e0daf76e787219fcd2d93fb5055eaa8cba36a5"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-AboutPageModule-55795f560f10f133ab1cc74cb3a55939f3ed0bc1c22d6effd504f3acdfa57628dd1c39612c432b68b0a45337c2e0daf76e787219fcd2d93fb5055eaa8cba36a5"' :
                                            'id="xs-components-links-module-AboutPageModule-55795f560f10f133ab1cc74cb3a55939f3ed0bc1c22d6effd504f3acdfa57628dd1c39612c432b68b0a45337c2e0daf76e787219fcd2d93fb5055eaa8cba36a5"' }>
                                            <li class="link">
                                                <a href="components/AboutPage.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AboutPage</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/AboutPageRoutingModule.html" data-type="entity-link" >AboutPageRoutingModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/AppModule.html" data-type="entity-link" >AppModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-AppModule-e52a02b56c75ea6e4c2a30a24ec03f60256efecf86d07727a41ecd6c1da4fc7553846ab22f0a29ca99c0b36a0f978ea423201a65f4326140e07b5c34421dbf93"' : 'data-bs-target="#xs-components-links-module-AppModule-e52a02b56c75ea6e4c2a30a24ec03f60256efecf86d07727a41ecd6c1da4fc7553846ab22f0a29ca99c0b36a0f978ea423201a65f4326140e07b5c34421dbf93"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-AppModule-e52a02b56c75ea6e4c2a30a24ec03f60256efecf86d07727a41ecd6c1da4fc7553846ab22f0a29ca99c0b36a0f978ea423201a65f4326140e07b5c34421dbf93"' :
                                            'id="xs-components-links-module-AppModule-e52a02b56c75ea6e4c2a30a24ec03f60256efecf86d07727a41ecd6c1da4fc7553846ab22f0a29ca99c0b36a0f978ea423201a65f4326140e07b5c34421dbf93"' }>
                                            <li class="link">
                                                <a href="components/AppComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AppComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#injectables-links-module-AppModule-e52a02b56c75ea6e4c2a30a24ec03f60256efecf86d07727a41ecd6c1da4fc7553846ab22f0a29ca99c0b36a0f978ea423201a65f4326140e07b5c34421dbf93"' : 'data-bs-target="#xs-injectables-links-module-AppModule-e52a02b56c75ea6e4c2a30a24ec03f60256efecf86d07727a41ecd6c1da4fc7553846ab22f0a29ca99c0b36a0f978ea423201a65f4326140e07b5c34421dbf93"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AppModule-e52a02b56c75ea6e4c2a30a24ec03f60256efecf86d07727a41ecd6c1da4fc7553846ab22f0a29ca99c0b36a0f978ea423201a65f4326140e07b5c34421dbf93"' :
                                        'id="xs-injectables-links-module-AppModule-e52a02b56c75ea6e4c2a30a24ec03f60256efecf86d07727a41ecd6c1da4fc7553846ab22f0a29ca99c0b36a0f978ea423201a65f4326140e07b5c34421dbf93"' }>
                                        <li class="link">
                                            <a href="injectables/ArtistsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ArtistsService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/AudioPlayerService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AudioPlayerService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/EnhancedAudioPlayerService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >EnhancedAudioPlayerService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/PlaylistsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PlaylistsService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SongEnrichmentService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SongEnrichmentService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/SongsService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SongsService</a>
                                        </li>
                                        <li class="link">
                                            <a href="injectables/UserService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UserService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/AppRoutingModule.html" data-type="entity-link" >AppRoutingModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/ArtistProfilePageModule.html" data-type="entity-link" >ArtistProfilePageModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-ArtistProfilePageModule-43f7db8156270104cbf04b7e9a481f69c6ceb2a59ef8312ad79df06f17bbcd6e0bf8bbd0317fa2f5ccd2d200bad5170af710ba2ecce25074ba7ee12bf000ef4e"' : 'data-bs-target="#xs-components-links-module-ArtistProfilePageModule-43f7db8156270104cbf04b7e9a481f69c6ceb2a59ef8312ad79df06f17bbcd6e0bf8bbd0317fa2f5ccd2d200bad5170af710ba2ecce25074ba7ee12bf000ef4e"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-ArtistProfilePageModule-43f7db8156270104cbf04b7e9a481f69c6ceb2a59ef8312ad79df06f17bbcd6e0bf8bbd0317fa2f5ccd2d200bad5170af710ba2ecce25074ba7ee12bf000ef4e"' :
                                            'id="xs-components-links-module-ArtistProfilePageModule-43f7db8156270104cbf04b7e9a481f69c6ceb2a59ef8312ad79df06f17bbcd6e0bf8bbd0317fa2f5ccd2d200bad5170af710ba2ecce25074ba7ee12bf000ef4e"' }>
                                            <li class="link">
                                                <a href="components/ArtistProfilePage.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ArtistProfilePage</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/ArtistProfilePageRoutingModule.html" data-type="entity-link" >ArtistProfilePageRoutingModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/ArtistsPageModule.html" data-type="entity-link" >ArtistsPageModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-ArtistsPageModule-afed233feb888952aa1c98713684ce272ed9e3fc0c4eee8b1b606243af44ae722a17dbb6e229b05e73c40f2a93924e6123eaaf8723d8415da59a0aea2419a868"' : 'data-bs-target="#xs-components-links-module-ArtistsPageModule-afed233feb888952aa1c98713684ce272ed9e3fc0c4eee8b1b606243af44ae722a17dbb6e229b05e73c40f2a93924e6123eaaf8723d8415da59a0aea2419a868"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-ArtistsPageModule-afed233feb888952aa1c98713684ce272ed9e3fc0c4eee8b1b606243af44ae722a17dbb6e229b05e73c40f2a93924e6123eaaf8723d8415da59a0aea2419a868"' :
                                            'id="xs-components-links-module-ArtistsPageModule-afed233feb888952aa1c98713684ce272ed9e3fc0c4eee8b1b606243af44ae722a17dbb6e229b05e73c40f2a93924e6123eaaf8723d8415da59a0aea2419a868"' }>
                                            <li class="link">
                                                <a href="components/ArtistModalComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ArtistModalComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ArtistsPage.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ArtistsPage</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/ArtistsPageRoutingModule.html" data-type="entity-link" >ArtistsPageRoutingModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/HomePageModule.html" data-type="entity-link" >HomePageModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-HomePageModule-d52ff12bebf95fc216e4e63b55242ea5702bcc5925d63e03c5cc756b25b3355acbd941ead1b807bc87ae78f3d85e77818c5ee45d65882573bf80f4e68749f99a"' : 'data-bs-target="#xs-components-links-module-HomePageModule-d52ff12bebf95fc216e4e63b55242ea5702bcc5925d63e03c5cc756b25b3355acbd941ead1b807bc87ae78f3d85e77818c5ee45d65882573bf80f4e68749f99a"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-HomePageModule-d52ff12bebf95fc216e4e63b55242ea5702bcc5925d63e03c5cc756b25b3355acbd941ead1b807bc87ae78f3d85e77818c5ee45d65882573bf80f4e68749f99a"' :
                                            'id="xs-components-links-module-HomePageModule-d52ff12bebf95fc216e4e63b55242ea5702bcc5925d63e03c5cc756b25b3355acbd941ead1b807bc87ae78f3d85e77818c5ee45d65882573bf80f4e68749f99a"' }>
                                            <li class="link">
                                                <a href="components/HomePage.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >HomePage</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/HomePageRoutingModule.html" data-type="entity-link" >HomePageRoutingModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/LoginPageModule.html" data-type="entity-link" >LoginPageModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-LoginPageModule-ca78c527d4d1904df0863a99f295a70dfaa3a5b54424212689936ea8a622bb53f33a526a1c9adf7146424bbe004c6135e294db7dce1a243991fb979e960cfe4b"' : 'data-bs-target="#xs-components-links-module-LoginPageModule-ca78c527d4d1904df0863a99f295a70dfaa3a5b54424212689936ea8a622bb53f33a526a1c9adf7146424bbe004c6135e294db7dce1a243991fb979e960cfe4b"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-LoginPageModule-ca78c527d4d1904df0863a99f295a70dfaa3a5b54424212689936ea8a622bb53f33a526a1c9adf7146424bbe004c6135e294db7dce1a243991fb979e960cfe4b"' :
                                            'id="xs-components-links-module-LoginPageModule-ca78c527d4d1904df0863a99f295a70dfaa3a5b54424212689936ea8a622bb53f33a526a1c9adf7146424bbe004c6135e294db7dce1a243991fb979e960cfe4b"' }>
                                            <li class="link">
                                                <a href="components/LoginPage.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LoginPage</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/LoginPageRoutingModule.html" data-type="entity-link" >LoginPageRoutingModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/PlaylistDetailPageModule.html" data-type="entity-link" >PlaylistDetailPageModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-PlaylistDetailPageModule-dae1f159b1bb10991e573a2720f5565e04f10730b0836cf0aaaf8b82e5b96006394ea53af4fbb187ef11620b21c53f132ae446ab1316f044225078a0b91ef9da"' : 'data-bs-target="#xs-components-links-module-PlaylistDetailPageModule-dae1f159b1bb10991e573a2720f5565e04f10730b0836cf0aaaf8b82e5b96006394ea53af4fbb187ef11620b21c53f132ae446ab1316f044225078a0b91ef9da"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-PlaylistDetailPageModule-dae1f159b1bb10991e573a2720f5565e04f10730b0836cf0aaaf8b82e5b96006394ea53af4fbb187ef11620b21c53f132ae446ab1316f044225078a0b91ef9da"' :
                                            'id="xs-components-links-module-PlaylistDetailPageModule-dae1f159b1bb10991e573a2720f5565e04f10730b0836cf0aaaf8b82e5b96006394ea53af4fbb187ef11620b21c53f132ae446ab1316f044225078a0b91ef9da"' }>
                                            <li class="link">
                                                <a href="components/PlaylistDetailPage.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PlaylistDetailPage</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/PlaylistDetailPageRoutingModule.html" data-type="entity-link" >PlaylistDetailPageRoutingModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/PlaylistsPageModule.html" data-type="entity-link" >PlaylistsPageModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-PlaylistsPageModule-e9098f257071abd0b7dd2db0f11cd62cd7ec13f43ef136ddbe72367994e8d59a00273d2e3bf85ba4aa6b0a0eabb2b8b0fcdb2c64dff6ae532c545917473e7793"' : 'data-bs-target="#xs-components-links-module-PlaylistsPageModule-e9098f257071abd0b7dd2db0f11cd62cd7ec13f43ef136ddbe72367994e8d59a00273d2e3bf85ba4aa6b0a0eabb2b8b0fcdb2c64dff6ae532c545917473e7793"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-PlaylistsPageModule-e9098f257071abd0b7dd2db0f11cd62cd7ec13f43ef136ddbe72367994e8d59a00273d2e3bf85ba4aa6b0a0eabb2b8b0fcdb2c64dff6ae532c545917473e7793"' :
                                            'id="xs-components-links-module-PlaylistsPageModule-e9098f257071abd0b7dd2db0f11cd62cd7ec13f43ef136ddbe72367994e8d59a00273d2e3bf85ba4aa6b0a0eabb2b8b0fcdb2c64dff6ae532c545917473e7793"' }>
                                            <li class="link">
                                                <a href="components/PlaylistsPage.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PlaylistsPage</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/PlaylistsPageRoutingModule.html" data-type="entity-link" >PlaylistsPageRoutingModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/ProfilePageModule.html" data-type="entity-link" >ProfilePageModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-ProfilePageModule-c942d5e02cd6d480ada6f83667c1b10b76d4a6ab71d4385f9a48173d61d830b280814af29b8a5958ab2a4291b36c164ee03e386cef86442a24f5552fdc47c474"' : 'data-bs-target="#xs-components-links-module-ProfilePageModule-c942d5e02cd6d480ada6f83667c1b10b76d4a6ab71d4385f9a48173d61d830b280814af29b8a5958ab2a4291b36c164ee03e386cef86442a24f5552fdc47c474"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-ProfilePageModule-c942d5e02cd6d480ada6f83667c1b10b76d4a6ab71d4385f9a48173d61d830b280814af29b8a5958ab2a4291b36c164ee03e386cef86442a24f5552fdc47c474"' :
                                            'id="xs-components-links-module-ProfilePageModule-c942d5e02cd6d480ada6f83667c1b10b76d4a6ab71d4385f9a48173d61d830b280814af29b8a5958ab2a4291b36c164ee03e386cef86442a24f5552fdc47c474"' }>
                                            <li class="link">
                                                <a href="components/ProfilePage.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ProfilePage</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/ProfilePageRoutingModule.html" data-type="entity-link" >ProfilePageRoutingModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/RegisterPageModule.html" data-type="entity-link" >RegisterPageModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-RegisterPageModule-65134e927c042830919808d4c2a4313f25252da86d893e8dc62588f91350405d69bcbf00749320734e82402171613598baa529731dc07620c8f39a1134ba8a03"' : 'data-bs-target="#xs-components-links-module-RegisterPageModule-65134e927c042830919808d4c2a4313f25252da86d893e8dc62588f91350405d69bcbf00749320734e82402171613598baa529731dc07620c8f39a1134ba8a03"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-RegisterPageModule-65134e927c042830919808d4c2a4313f25252da86d893e8dc62588f91350405d69bcbf00749320734e82402171613598baa529731dc07620c8f39a1134ba8a03"' :
                                            'id="xs-components-links-module-RegisterPageModule-65134e927c042830919808d4c2a4313f25252da86d893e8dc62588f91350405d69bcbf00749320734e82402171613598baa529731dc07620c8f39a1134ba8a03"' }>
                                            <li class="link">
                                                <a href="components/RegisterPage.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RegisterPage</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/RegisterPageRoutingModule.html" data-type="entity-link" >RegisterPageRoutingModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/SharedModule.html" data-type="entity-link" >SharedModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-SharedModule-4980754013d15827bbfd735617816a93780351be01f0f9c022b7d5c0e31ab4c4125f5448b63f0e179d8631488892b042d1038c5267011c4e99d0b00fcb7d539a"' : 'data-bs-target="#xs-components-links-module-SharedModule-4980754013d15827bbfd735617816a93780351be01f0f9c022b7d5c0e31ab4c4125f5448b63f0e179d8631488892b042d1038c5267011c4e99d0b00fcb7d539a"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-SharedModule-4980754013d15827bbfd735617816a93780351be01f0f9c022b7d5c0e31ab4c4125f5448b63f0e179d8631488892b042d1038c5267011c4e99d0b00fcb7d539a"' :
                                            'id="xs-components-links-module-SharedModule-4980754013d15827bbfd735617816a93780351be01f0f9c022b7d5c0e31ab4c4125f5448b63f0e179d8631488892b042d1038c5267011c4e99d0b00fcb7d539a"' }>
                                            <li class="link">
                                                <a href="components/ArtistGridCardComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ArtistGridCardComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/AudioPlayerComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AudioPlayerComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ChangePasswordModalComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ChangePasswordModalComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/ClickableArtistNamesComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ClickableArtistNamesComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/EditProfileModalComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >EditProfileModalComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/FollowArtistButtonComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FollowArtistButtonComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/GlobalSearchComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >GlobalSearchComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LikeButtonComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LikeButtonComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/PictureSelectableComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PictureSelectableComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/PlayButtonComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PlayButtonComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/PlaylistLikeButtonComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PlaylistLikeButtonComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/PlaylistModalComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PlaylistModalComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SongDetailModalComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SongDetailModalComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SongGridCardComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SongGridCardComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SongModalComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SongModalComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                        'data-bs-target="#directives-links-module-SharedModule-4980754013d15827bbfd735617816a93780351be01f0f9c022b7d5c0e31ab4c4125f5448b63f0e179d8631488892b042d1038c5267011c4e99d0b00fcb7d539a"' : 'data-bs-target="#xs-directives-links-module-SharedModule-4980754013d15827bbfd735617816a93780351be01f0f9c022b7d5c0e31ab4c4125f5448b63f0e179d8631488892b042d1038c5267011c4e99d0b00fcb7d539a"' }>
                                        <span class="icon ion-md-code-working"></span>
                                        <span>Directives</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="directives-links-module-SharedModule-4980754013d15827bbfd735617816a93780351be01f0f9c022b7d5c0e31ab4c4125f5448b63f0e179d8631488892b042d1038c5267011c4e99d0b00fcb7d539a"' :
                                        'id="xs-directives-links-module-SharedModule-4980754013d15827bbfd735617816a93780351be01f0f9c022b7d5c0e31ab4c4125f5448b63f0e179d8631488892b042d1038c5267011c4e99d0b00fcb7d539a"' }>
                                        <li class="link">
                                            <a href="directives/DragDropDirective.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DragDropDirective</a>
                                        </li>
                                    </ul>
                                </li>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#pipes-links-module-SharedModule-4980754013d15827bbfd735617816a93780351be01f0f9c022b7d5c0e31ab4c4125f5448b63f0e179d8631488892b042d1038c5267011c4e99d0b00fcb7d539a"' : 'data-bs-target="#xs-pipes-links-module-SharedModule-4980754013d15827bbfd735617816a93780351be01f0f9c022b7d5c0e31ab4c4125f5448b63f0e179d8631488892b042d1038c5267011c4e99d0b00fcb7d539a"' }>
                                            <span class="icon ion-md-add"></span>
                                            <span>Pipes</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="pipes-links-module-SharedModule-4980754013d15827bbfd735617816a93780351be01f0f9c022b7d5c0e31ab4c4125f5448b63f0e179d8631488892b042d1038c5267011c4e99d0b00fcb7d539a"' :
                                            'id="xs-pipes-links-module-SharedModule-4980754013d15827bbfd735617816a93780351be01f0f9c022b7d5c0e31ab4c4125f5448b63f0e179d8631488892b042d1038c5267011c4e99d0b00fcb7d539a"' }>
                                            <li class="link">
                                                <a href="pipes/DurationPipe.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DurationPipe</a>
                                            </li>
                                            <li class="link">
                                                <a href="pipes/PasswordVisibilityPipe.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PasswordVisibilityPipe</a>
                                            </li>
                                            <li class="link">
                                                <a href="pipes/PlaylistDurationPipe.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PlaylistDurationPipe</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/SongsPageModule.html" data-type="entity-link" >SongsPageModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ?
                                            'data-bs-target="#components-links-module-SongsPageModule-825cc023dbeff794c20441e751773f727bb979be0fb07040054a0bfeb80a0d1a6eb78f9e1978a12295a0f5bde4d12a26001ac5717230b737048c6623d80341d9"' : 'data-bs-target="#xs-components-links-module-SongsPageModule-825cc023dbeff794c20441e751773f727bb979be0fb07040054a0bfeb80a0d1a6eb78f9e1978a12295a0f5bde4d12a26001ac5717230b737048c6623d80341d9"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-SongsPageModule-825cc023dbeff794c20441e751773f727bb979be0fb07040054a0bfeb80a0d1a6eb78f9e1978a12295a0f5bde4d12a26001ac5717230b737048c6623d80341d9"' :
                                            'id="xs-components-links-module-SongsPageModule-825cc023dbeff794c20441e751773f727bb979be0fb07040054a0bfeb80a0d1a6eb78f9e1978a12295a0f5bde4d12a26001ac5717230b737048c6623d80341d9"' }>
                                            <li class="link">
                                                <a href="components/SongsPage.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SongsPage</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/SongsPageRoutingModule.html" data-type="entity-link" >SongsPageRoutingModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/SplashPageRoutingModule.html" data-type="entity-link" >SplashPageRoutingModule</a>
                            </li>
                </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#components-links"' :
                            'data-bs-target="#xs-components-links"' }>
                            <span class="icon ion-md-cog"></span>
                            <span>Components</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="components-links"' : 'id="xs-components-links"' }>
                            <li class="link">
                                <a href="components/SplashPage.html" data-type="entity-link" >SplashPage</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#classes-links"' :
                            'data-bs-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/BaseMediaService.html" data-type="entity-link" >BaseMediaService</a>
                            </li>
                            <li class="link">
                                <a href="classes/StrapiMediaService.html" data-type="entity-link" >StrapiMediaService</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#injectables-links"' :
                                'data-bs-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/ArtistsMappingStrapi.html" data-type="entity-link" >ArtistsMappingStrapi</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ArtistsService.html" data-type="entity-link" >ArtistsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AudioPlayerService.html" data-type="entity-link" >AudioPlayerService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/BaseAuthenticationService.html" data-type="entity-link" >BaseAuthenticationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/BaseRepositoryFirebaseService.html" data-type="entity-link" >BaseRepositoryFirebaseService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/BaseRepositoryHttpService.html" data-type="entity-link" >BaseRepositoryHttpService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/BaseRepositoryLocalStorageService.html" data-type="entity-link" >BaseRepositoryLocalStorageService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/BaseService.html" data-type="entity-link" >BaseService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/EnhancedAudioPlayerService.html" data-type="entity-link" >EnhancedAudioPlayerService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FirebaseAuthenticationService.html" data-type="entity-link" >FirebaseAuthenticationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FirebaseCollectionSubscriptionService.html" data-type="entity-link" >FirebaseCollectionSubscriptionService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FirebaseMediaService.html" data-type="entity-link" >FirebaseMediaService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/JsonServerRepositoryService.html" data-type="entity-link" >JsonServerRepositoryService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/LanguageService.html" data-type="entity-link" >LanguageService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/PlaylistsMappingStrapi.html" data-type="entity-link" >PlaylistsMappingStrapi</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/PlaylistsService.html" data-type="entity-link" >PlaylistsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/ShareService.html" data-type="entity-link" >ShareService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SocialService.html" data-type="entity-link" >SocialService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SongEnrichmentService.html" data-type="entity-link" >SongEnrichmentService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SongsMappingStrapi.html" data-type="entity-link" >SongsMappingStrapi</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/SongsService.html" data-type="entity-link" >SongsService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/StrapiAuthenticationService.html" data-type="entity-link" >StrapiAuthenticationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/StrapiAuthMappingService.html" data-type="entity-link" >StrapiAuthMappingService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/StrapiRepositoryService.html" data-type="entity-link" >StrapiRepositoryService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UserMappingStrapiService.html" data-type="entity-link" >UserMappingStrapiService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UserService.html" data-type="entity-link" >UserService</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#interfaces-links"' :
                            'data-bs-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/Artist.html" data-type="entity-link" >Artist</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ArtistData.html" data-type="entity-link" >ArtistData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CollectionChange.html" data-type="entity-link" >CollectionChange</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Data.html" data-type="entity-link" >Data</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EnrichedSong.html" data-type="entity-link" >EnrichedSong</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EnrichedSong-1.html" data-type="entity-link" >EnrichedSong</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EnrichedSong-2.html" data-type="entity-link" >EnrichedSong</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FirebaseArtist.html" data-type="entity-link" >FirebaseArtist</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FirebaseGroup.html" data-type="entity-link" >FirebaseGroup</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FirebasePerson.html" data-type="entity-link" >FirebasePerson</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FirebasePlaylist.html" data-type="entity-link" >FirebasePlaylist</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FirebaseSong.html" data-type="entity-link" >FirebaseSong</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FirebaseUser.html" data-type="entity-link" >FirebaseUser</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Formats.html" data-type="entity-link" >Formats</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Group.html" data-type="entity-link" >Group</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IArtistsRepository.html" data-type="entity-link" >IArtistsRepository</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IArtistsService.html" data-type="entity-link" >IArtistsService</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IAuthentication.html" data-type="entity-link" >IAuthentication</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IAuthMapping.html" data-type="entity-link" >IAuthMapping</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IBaseMapping.html" data-type="entity-link" >IBaseMapping</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IBaseRepository.html" data-type="entity-link" >IBaseRepository</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IBaseRepository-1.html" data-type="entity-link" >IBaseRepository</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IBaseService.html" data-type="entity-link" >IBaseService</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ICollectionSubscription.html" data-type="entity-link" >ICollectionSubscription</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IPlaylistsRepository.html" data-type="entity-link" >IPlaylistsRepository</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IPlaylistsService.html" data-type="entity-link" >IPlaylistsService</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ISongsRepository.html" data-type="entity-link" >ISongsRepository</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ISongsService.html" data-type="entity-link" >ISongsService</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IStrapiAuthentication.html" data-type="entity-link" >IStrapiAuthentication</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ITasksService.html" data-type="entity-link" >ITasksService</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IUserMapping.html" data-type="entity-link" >IUserMapping</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IUserRepository.html" data-type="entity-link" >IUserRepository</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/IUserService.html" data-type="entity-link" >IUserService</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Large.html" data-type="entity-link" >Large</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Medium.html" data-type="entity-link" >Medium</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Meta.html" data-type="entity-link" >Meta</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Model.html" data-type="entity-link" >Model</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Paginated.html" data-type="entity-link" >Paginated</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PaginatedRaw.html" data-type="entity-link" >PaginatedRaw</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PaginatedRaw-1.html" data-type="entity-link" >PaginatedRaw</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Pagination.html" data-type="entity-link" >Pagination</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Person.html" data-type="entity-link" >Person</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PlayerState.html" data-type="entity-link" >PlayerState</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Playlist.html" data-type="entity-link" >Playlist</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ProviderMetadata.html" data-type="entity-link" >ProviderMetadata</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ReactiveEnrichedSong.html" data-type="entity-link" >ReactiveEnrichedSong</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SearchOperators.html" data-type="entity-link" >SearchOperators</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SearchParams.html" data-type="entity-link" >SearchParams</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SearchResult.html" data-type="entity-link" >SearchResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SearchResult-1.html" data-type="entity-link" >SearchResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SearchSuggestion.html" data-type="entity-link" >SearchSuggestion</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SignInPayload.html" data-type="entity-link" >SignInPayload</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SignInPayload-1.html" data-type="entity-link" >SignInPayload</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SignUpPayload.html" data-type="entity-link" >SignUpPayload</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SignUpPayload-1.html" data-type="entity-link" >SignUpPayload</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Small.html" data-type="entity-link" >Small</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Song.html" data-type="entity-link" >Song</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SongWithArtists.html" data-type="entity-link" >SongWithArtists</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SongWithArtists-1.html" data-type="entity-link" >SongWithArtists</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SongWithArtists-2.html" data-type="entity-link" >SongWithArtists</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SongWithArtists-3.html" data-type="entity-link" >SongWithArtists</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/StrapiMedia.html" data-type="entity-link" >StrapiMedia</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/StrapiMediaData.html" data-type="entity-link" >StrapiMediaData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/StrapiMeResponse.html" data-type="entity-link" >StrapiMeResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/StrapiPlaylistResponse.html" data-type="entity-link" >StrapiPlaylistResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/StrapiSignIn.html" data-type="entity-link" >StrapiSignIn</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/StrapiSignInResponse.html" data-type="entity-link" >StrapiSignInResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/StrapiSignUp.html" data-type="entity-link" >StrapiSignUp</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/StrapiSignUpResponse.html" data-type="entity-link" >StrapiSignUpResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/StrapiSongResponse.html" data-type="entity-link" >StrapiSongResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/StrapiUser.html" data-type="entity-link" >StrapiUser</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/StrapiUser-1.html" data-type="entity-link" >StrapiUser</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/StrapiUserResponse.html" data-type="entity-link" >StrapiUserResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Task.html" data-type="entity-link" >Task</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Thumbnail.html" data-type="entity-link" >Thumbnail</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/User.html" data-type="entity-link" >User</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UserDisplayData.html" data-type="entity-link" >UserDisplayData</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#miscellaneous-links"'
                            : 'data-bs-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/typealiases.html" data-type="entity-link">Type aliases</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <a data-type="chapter-link" href="routes.html"><span class="icon ion-ios-git-branch"></span>Routes</a>
                        </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank" rel="noopener noreferrer">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});