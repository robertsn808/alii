package com.aliifishmarket.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "menu_items")
public class MenuItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    @NotBlank(message = "Menu item name is required")
    @Size(max = 100, message = "Name cannot exceed 100 characters")
    private String name;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(nullable = false, precision = 10, scale = 2)
    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.01", message = "Price must be greater than 0")
    private BigDecimal price;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MenuCategory category;
    
    @Column(name = "image_url")
    private String imageUrl;
    
    @Column(nullable = false)
    private Boolean available = true;
    
    @Column(nullable = false)
    private Boolean popular = false;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "spicy_level")
    private SpicyLevel spicyLevel;
    
    @ElementCollection
    @CollectionTable(name = "menu_item_allergens", joinColumns = @JoinColumn(name = "menu_item_id"))
    @Column(name = "allergen")
    private List<String> allergens;
    
    @Column(name = "preparation_time_minutes")
    @Min(value = 1, message = "Preparation time must be at least 1 minute")
    private Integer preparationTimeMinutes = 15;
    
    @ElementCollection
    @CollectionTable(name = "menu_item_tags", joinColumns = @JoinColumn(name = "menu_item_id"))
    @Column(name = "tag")
    private List<String> tags;
    
    // Nutritional information (optional)
    @Column(name = "calories")
    private Integer calories;
    
    @Column(name = "protein_grams")
    private Integer proteinGrams;
    
    @Column(name = "carbs_grams") 
    private Integer carbsGrams;
    
    @Column(name = "fat_grams")
    private Integer fatGrams;
    
    // Inventory tracking
    @Column(name = "current_stock")
    private Integer currentStock = 0;
    
    @Column(name = "minimum_stock")
    private Integer minimumStock = 0;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Constructors
    public MenuItem() {}
    
    public MenuItem(String name, String description, BigDecimal price, MenuCategory category) {
        this.name = name;
        this.description = description;
        this.price = price;
        this.category = category;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    
    public MenuCategory getCategory() { return category; }
    public void setCategory(MenuCategory category) { this.category = category; }
    
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    
    public Boolean getAvailable() { return available; }
    public void setAvailable(Boolean available) { this.available = available; }
    
    public Boolean getPopular() { return popular; }
    public void setPopular(Boolean popular) { this.popular = popular; }
    
    public SpicyLevel getSpicyLevel() { return spicyLevel; }
    public void setSpicyLevel(SpicyLevel spicyLevel) { this.spicyLevel = spicyLevel; }
    
    public List<String> getAllergens() { return allergens; }
    public void setAllergens(List<String> allergens) { this.allergens = allergens; }
    
    public Integer getPreparationTimeMinutes() { return preparationTimeMinutes; }
    public void setPreparationTimeMinutes(Integer preparationTimeMinutes) { 
        this.preparationTimeMinutes = preparationTimeMinutes; 
    }
    
    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }
    
    public Integer getCalories() { return calories; }
    public void setCalories(Integer calories) { this.calories = calories; }
    
    public Integer getProteinGrams() { return proteinGrams; }
    public void setProteinGrams(Integer proteinGrams) { this.proteinGrams = proteinGrams; }
    
    public Integer getCarbsGrams() { return carbsGrams; }
    public void setCarbsGrams(Integer carbsGrams) { this.carbsGrams = carbsGrams; }
    
    public Integer getFatGrams() { return fatGrams; }
    public void setFatGrams(Integer fatGrams) { this.fatGrams = fatGrams; }
    
    public Integer getCurrentStock() { return currentStock; }
    public void setCurrentStock(Integer currentStock) { this.currentStock = currentStock; }
    
    public Integer getMinimumStock() { return minimumStock; }
    public void setMinimumStock(Integer minimumStock) { this.minimumStock = minimumStock; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    // Business logic methods
    public boolean isLowStock() {
        return currentStock != null && minimumStock != null && currentStock <= minimumStock;
    }
    
    public boolean isInStock() {
        return available && (currentStock == null || currentStock > 0);
    }
    
    public enum MenuCategory {
        POKE_BOWLS("Poke Bowls"),
        FRESH_FISH("Fresh Fish"),
        PREPARED_FOODS("Prepared Foods"),
        SIDES("Sides"),
        BEVERAGES("Beverages"),
        DESSERTS("Desserts");
        
        private final String displayName;
        
        MenuCategory(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
    
    public enum SpicyLevel {
        MILD("Mild"),
        MEDIUM("Medium"), 
        SPICY("Spicy"),
        EXTRA_SPICY("Extra Spicy");
        
        private final String displayName;
        
        SpicyLevel(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
}