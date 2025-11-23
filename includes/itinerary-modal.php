<?php
/**
 * Itinerary Modal Component
 * 
 * This file provides a reusable itinerary modal component
 */
?>
<!-- Itinerary Modal Component -->
<div class="modal fade" id="itineraryModal" tabindex="-1" aria-labelledby="itineraryModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="itineraryModalLabel">Your Brewery Tour</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <!-- Itinerary Tabs -->
                <ul class="nav nav-tabs mb-3" id="itineraryTabs" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link active" id="list-tab" data-bs-toggle="tab" data-bs-target="#list-tab-pane" type="button" role="tab" aria-controls="list-tab-pane" aria-selected="true">
                            <i class="bi bi-list-check me-1" aria-hidden="true"></i> List View
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="map-tab" data-bs-toggle="tab" data-bs-target="#map-tab-pane" type="button" role="tab" aria-controls="map-tab-pane" aria-selected="false">
                            <i class="bi bi-map me-1" aria-hidden="true"></i> Map View
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="options-tab" data-bs-toggle="tab" data-bs-target="#options-tab-pane" type="button" role="tab" aria-controls="options-tab-pane" aria-selected="false">
                            <i class="bi bi-gear me-1" aria-hidden="true"></i> Options
                        </button>
                    </li>
                </ul>
                
                <!-- Tab Content -->
                <div class="tab-content" id="itineraryTabContent">
                    <!-- List View Tab -->
                    <div class="tab-pane fade show active" id="list-tab-pane" role="tabpanel" aria-labelledby="list-tab" tabindex="0">
                        <p class="text-muted small mb-2"><i class="bi bi-info-circle me-1" aria-hidden="true"></i> Drag and drop to reorder your brewery stops.</p>
                        
                        <div id="itineraryList" class="list-group mb-3">
                            <!-- Itinerary items will be added here dynamically -->
                        </div>
                        
                        <div class="alert alert-info" id="emptyItineraryMessage">
                            <p class="mb-0">Your itinerary is empty. Add breweries to create your tour!</p>
                        </div>
                        
                        <!-- Itinerary Summary -->
                        <div id="itinerarySummary" class="card mt-3 d-none">
                            <div class="card-body">
                                <h6 class="card-subtitle mb-2 text-muted">Tour Summary</h6>
                                <div class="row">
                                    <div class="col-sm-4 mb-2">
                                        <div class="d-flex align-items-center">
                                            <i class="bi bi-building me-2 text-primary" style="font-size: 1.5rem;"></i>
                                            <div>
                                                <div class="small text-muted">Breweries</div>
                                                <div class="fw-bold" id="summaryBreweryCount">0</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-sm-4 mb-2">
                                        <div class="d-flex align-items-center">
                                            <i class="bi bi-geo-alt me-2 text-primary" style="font-size: 1.5rem;"></i>
                                            <div>
                                                <div class="small text-muted">Distance</div>
                                                <div class="fw-bold" id="summaryDistance">0 mi</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-sm-4 mb-2">
                                        <div class="d-flex align-items-center">
                                            <i class="bi bi-clock me-2 text-primary" style="font-size: 1.5rem;"></i>
                                            <div>
                                                <div class="small text-muted">Est. Time</div>
                                                <div class="fw-bold" id="summaryTime">0 hrs</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Map View Tab -->
                    <div class="tab-pane fade" id="map-tab-pane" role="tabpanel" aria-labelledby="map-tab" tabindex="0">
                        <div id="itineraryMapPreview" style="height: 400px; width: 100%;"></div>
                        <div class="alert alert-info mt-2" id="emptyMapMessage">
                            <p class="mb-0">Add breweries to your itinerary to see them on the map.</p>
                        </div>
                        <div class="d-flex justify-content-between mt-2">
                            <button type="button" class="btn btn-sm btn-outline-primary" id="optimizeRouteBtn">
                                <i class="bi bi-shuffle me-1" aria-hidden="true"></i> Optimize Route
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-secondary" id="getDirectionsBtn">
                                <i class="bi bi-signpost-2 me-1" aria-hidden="true"></i> Get Directions
                            </button>
                        </div>
                    </div>
                    
                    <!-- Options Tab -->
                    <div class="tab-pane fade" id="options-tab-pane" role="tabpanel" aria-labelledby="options-tab" tabindex="0">
                        <form id="itineraryOptionsForm">
                            <div class="mb-3">
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label for="itineraryName" class="form-label">Itinerary Name</label>
                                <input type="text" class="form-control" id="itineraryName" placeholder="My Ohio Brewery Tour">
                            </div>
                            <div class="col-md-6">
                                <label for="itineraryDate" class="form-label">Tour Date</label>
                                <input type="date" class="form-control" id="itineraryDate">
                            </div>
                            <div class="col-12">
                                <label for="itineraryNotes" class="form-label">Notes</label>
                                <textarea class="form-control" id="itineraryNotes" rows="2" placeholder="Add any notes about your brewery tour..."></textarea>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Itinerary Map Preview -->
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">Tour Route Preview</h6>
                    </div>
                    <div class="card-body p-0">
                        <div id="itineraryMapPreview" style="height: 250px;"></div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <div class="d-flex justify-content-between w-100">
                    <div>
                        <button type="button" class="btn btn-outline-danger" id="clearItineraryBtn">
                            <i class="bi bi-trash"></i> Clear Itinerary
                        </button>
                    </div>
                    <div>
                        <div class="btn-group" role="group">
                            <button type="button" class="btn btn-outline-primary dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                                <i class="bi bi-share"></i> Share
                            </button>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="#" id="shareEmailBtn"><i class="bi bi-envelope"></i> Email</a></li>
                                <li><a class="dropdown-item" href="#" id="shareTextBtn"><i class="bi bi-chat"></i> Text Message</a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item" href="#" id="copyLinkBtn"><i class="bi bi-link-45deg"></i> Copy Link</a></li>
                            </ul>
                        </div>
                        <button type="button" class="btn btn-outline-primary" id="printItineraryBtn">
                            <i class="bi bi-printer"></i> Print
                        </button>
                        <button type="button" class="btn btn-primary" id="saveItineraryBtn">
                            <i class="bi bi-save"></i> Save Itinerary
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Itinerary Saved Confirmation Modal -->
<div class="modal fade" id="itinerarySavedModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-sm">
        <div class="modal-content">
            <div class="modal-body text-center py-4">
                <i class="bi bi-check-circle text-success display-1 mb-3"></i>
                <h5>Itinerary Saved!</h5>
                <p>Your brewery tour has been saved successfully.</p>
                <button type="button" class="btn btn-primary" data-bs-dismiss="modal">
                    OK
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Itinerary Share Modal -->
<div class="modal fade" id="shareItineraryModal" tabindex="-1" aria-labelledby="shareItineraryModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="shareItineraryModalLabel">Share Your Brewery Tour</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div class="mb-3">
                    <label for="shareEmail" class="form-label">Email Address</label>
                    <input type="email" class="form-control" id="shareEmail" placeholder="friend@example.com">
                </div>
                <div class="mb-3">
                    <label for="shareMessage" class="form-label">Message (Optional)</label>
                    <textarea class="form-control" id="shareMessage" rows="3" placeholder="Check out this brewery tour I created!"></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary" id="sendShareBtn">
                    <i class="bi bi-send"></i> Send
                </button>
            </div>
        </div>
    </div>
</div>
